import { Provider, ProviderConstructor } from "../core/provider";
import { InitialAllocation, NativeClarityBinProvider } from "./clarityBin";

export class ProviderRegistry {
  static availableProviders: ProviderConstructor[] = [];

  // Cached the loading promise to avoid race conditions during repeated invocations.
  static defaultLoadCachedPromise: Promise<false | ProviderConstructor> | undefined;

  static registerProvider(providerConstructor: ProviderConstructor, clearExisting = false) {
    if (clearExisting) {
      this.availableProviders.length = 0;
    }
    this.availableProviders.push(providerConstructor);
  }

  /**
   * Attempt loading the default `clarity-native-bin` module. This module must be set as
   * a `peerDependency` and dynamically imported to avoid issues with circular dependencies,
   * and allow consuming libs to specify their own provider.
   * @returns Promise resolves to a `ProviderConstructor` if loaded successfully, or `false`
   * if the module is not available.
   */
  static tryLoadDefaultBinProvider(): Promise<false | ProviderConstructor> {
    if (this.defaultLoadCachedPromise) {
      return this.defaultLoadCachedPromise;
    }
    const loadPromise = Promise.resolve<false | ProviderConstructor>(
      (async () => {
        let nativeBinModule: { getDefaultBinaryFilePath: () => string };
        try {
          nativeBinModule = await import("@blockstack/clarity-native-bin");
        } catch (e) {
          // node.js runtime require error
          if (e.code === "MODULE_NOT_FOUND") {
            return false;
          }
          // es6 dynamic import errors
          if (e.message) {
            const importErrStrings = [
              "error loading dynamically imported module",
              "error resolving module specifier",
              "failed to fetch dynamically imported module",
              "failed to resolve module"
            ];
            const errMsg = (e.message as string).toLowerCase();
            if (importErrStrings.some(errStr => errMsg.includes(errStr))) {
              return false;
            }
          }
          throw e;
        }
        const nativeBinFile = nativeBinModule.getDefaultBinaryFilePath();
        const providerConstructor: ProviderConstructor = {
          create: (allocations) =>
            NativeClarityBinProvider.createEphemeral(allocations, nativeBinFile),
        };
        // Reset the cached promise so that future invocations have the chance to retry.
        this.defaultLoadCachedPromise = undefined;
        return providerConstructor;
      })()
    );
    this.defaultLoadCachedPromise = loadPromise;
    return this.defaultLoadCachedPromise;
  }

  /**
   * Creates an instance of the last registered provider.
   * @param allocations initializes the given accounts with
   * amount of STXs at start. Defaults to empty list.
   * @param noWarn Set to true to disable warning log about multiple registered providers.
   */
  static async createProvider(
    allocations: InitialAllocation[] = [],
    noWarn = false
  ): Promise<Provider> {
    if (this.availableProviders.length === 0) {
      const defaultProvider = await this.tryLoadDefaultBinProvider();
      if (defaultProvider === false) {
        throw new Error(
          "No provider is registered. Install the `@blockstack/clarity-native-bin` peer " +
            "dependency or register a provider manually with `registerProvider()`."
        );
      } else {
        this.availableProviders.push(defaultProvider);
      }
    }
    if (!noWarn && this.availableProviders.length > 1) {
      console.warn(
        "Multiple providers are registered. The last registered provider will be returned."
      );
    }
    // Return the last registered provider
    const providerConstructor = this.availableProviders[this.availableProviders.length - 1];
    return providerConstructor.create(allocations);
  }

  private constructor() {}
}
