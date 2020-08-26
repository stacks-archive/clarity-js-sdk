/*
 * Gratefully borrowed from https://github.com/lovell/detect-libc/blob/master/lib/detect-libc.js
 *
 * Copyright 2017 Lovell Fuller
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { spawnSync, SpawnSyncOptionsWithStringEncoding } from 'child_process';
import { readdirSync } from 'fs';
import { platform } from 'os';

export function detectLibc() {
  const GLIBC = 'glibc';
  const MUSL = 'musl';

  const spawnOptions: SpawnSyncOptionsWithStringEncoding = {
    encoding: 'utf8',
    env: process.env,
  };

  function contains(needle: string) {
    return (haystack: string) => {
      return haystack.indexOf(needle) !== -1;
    };
  }

  function versionFromMuslLdd(out: string) {
    return out
      .split(/[\r\n]+/)[1]
      .trim()
      .split(/\s/)[1];
  }

  function safeReaddirSync(path: string) {
    try {
      return readdirSync(path);
    } catch (e) {
      // ignore
    }
    return [];
  }

  let family = '';
  let version = '';
  let method = '';

  if (platform() === 'linux') {
    // Try getconf
    const glibc = spawnSync('getconf', ['GNU_LIBC_VERSION'], spawnOptions);
    if (glibc.status === 0) {
      family = GLIBC;
      version = glibc.stdout.trim().split(' ')[1];
      method = 'getconf';
    } else {
      // Try ldd
      const ldd = spawnSync('ldd', ['--version'], spawnOptions);
      if (ldd.status === 0 && ldd.stdout.indexOf(MUSL) !== -1) {
        family = MUSL;
        version = versionFromMuslLdd(ldd.stdout);
        method = 'ldd';
      } else if (ldd.status === 1 && ldd.stderr.indexOf(MUSL) !== -1) {
        family = MUSL;
        version = versionFromMuslLdd(ldd.stderr);
        method = 'ldd';
      } else {
        // Try filesystem (family only)
        const lib = safeReaddirSync('/lib');
        if (lib.some(contains('-linux-gnu'))) {
          family = GLIBC;
          method = 'filesystem';
        } else if (lib.some(contains('libc.musl-'))) {
          family = MUSL;
          method = 'filesystem';
        } else if (lib.some(contains('ld-musl-'))) {
          family = MUSL;
          method = 'filesystem';
        } else {
          const usrSbin = safeReaddirSync('/usr/sbin');
          if (usrSbin.some(contains('glibc'))) {
            family = GLIBC;
            method = 'filesystem';
          }
        }
      }
    }
  }

  const isNonGlibcLinux = family !== '' && family !== GLIBC;
  return {
    GLIBC: GLIBC,
    MUSL: MUSL,
    family: family,
    version: version,
    method: method,
    isNonGlibcLinux: isNonGlibcLinux,
  };
}
