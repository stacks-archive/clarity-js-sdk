;;  copyright: (c) 2013-2019 by Blockstack PBC, a public benefit corporation.

;;  This file is part of Blockstack.

;;  Blockstack is free software. You may redistribute or modify
;;  it under the terms of the GNU General Public License as published by
;;  the Free Software Foundation, either version 3 of the License or
;;  (at your option) any later version.

;;  Blockstack is distributed in the hope that it will be useful,
;;  but WITHOUT ANY WARRANTY, including without the implied warranty of
;;  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
;;  GNU General Public License for more details.

;;  You should have received a copy of the GNU General Public License
;;  along with Blockstack. If not, see <http://www.gnu.org/licenses/>.

;; Rocket-Market

;; Storage
(define-map rockets-info
  ((rocket-id int)) 
  ((owner principal)))
(define-map rockets-count
  ((owner principal))
  ((count int)))
(define-map factory-address
  ((id int))
  ((address principal)))

;; Internals

;; Gets the amount of rockets owned by the specified address.
(define (balance-of (account principal))
  (let ((balance
      (get count 
        (fetch-entry rockets-count (tuple (owner account))))))
    (if (eq? balance 'null) 0 balance)))

(define (is-tx-from-factory)
  (let ((address
    (get address 
        (fetch-entry factory-address (tuple (id 0))))))
    (eq? tx-sender address)))

;; Gets the owner of the specified rocket ID.
(define (owner-of (rocket-id int)) 
  (get owner 
    (fetch-entry rockets-info (tuple (rocket-id rocket-id)))))

;; Internal - Register rocket
(define (register-rocket! (new-owner principal) (rocket-id int))
  (let ((current-balance (balance-of new-owner)))
    (begin
      (set-entry! rockets-info 
        (tuple (rocket-id rocket-id))
        (tuple (owner new-owner))) 
      (set-entry! rockets-count 
        (tuple (owner new-owner))
        (tuple (count (+ 1 current-balance)))) 
      'true)))

;; Internal - Release rocket
(define (release-rocket! (owner principal) (rocket-id int))
  (let ((current-balance (balance-of owner)))
    (begin
      (set-entry! rockets-count 
        (tuple (owner owner))
        (tuple (count (- current-balance 1)))) 
      'true)))

;; Public functions

;; Transfers rocket to a specified principal.
(define-public (transfer (recipient principal) (rocket-id int))
  (if (and 
        (eq? (owner-of rocket-id) tx-sender)
        (not (eq? recipient tx-sender)))
    (and
      (release-rocket! tx-sender rocket-id)
      (register-rocket! recipient rocket-id))
    'false))

;; Mint new rockets.
(define-public (mint! (owner principal) (rocket-id int) (size int))
  (and
    (is-tx-from-factory)
    (let ((current-balance (balance-of owner)))
        (begin
        (insert-entry! rockets-info 
            (tuple (rocket-id rocket-id))
            (tuple (owner owner))) 
        (set-entry! rockets-count 
            (tuple (owner owner))
            (tuple (count (+ 1 current-balance)))) 
        'true))))

;; Set Factory
(define-public (set-factory)
  (let ((address
      (get address 
        (fetch-entry factory-address (tuple (id 0))))))
    (if (eq? address 'null) 
        (insert-entry! factory-address 
          (tuple (id 0))
          (tuple (address tx-sender)))
        'false)))

