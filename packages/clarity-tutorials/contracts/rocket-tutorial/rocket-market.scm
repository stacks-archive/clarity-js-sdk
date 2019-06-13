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

;;;; Rocket-Market

;;; Storage
(define-map rockets-info
  ((rocket-id int))
  ((owner principal)))
(define-map rockets-count
  ((owner principal))
  ((count int)))
(define-map factory-address
  ((id int))
  ((address principal)))

;;; Constants

(define no-such-rocket-err      (err 1))
(define bad-rocket-transfer-err (err 2))
(define unauthorized-mint-err   (err 3))
(define factory-already-set-err (err 4))

;;; Internals

;; Gets the amount of rockets owned by the specified address
;; args:
;; @account (principal) the principal of the user
;; returns: int
(define (balance-of (account principal))
  (default-to 0
    (get count
         (fetch-entry rockets-count ((owner account))))))

;; Check if the transaction has been sent by the factory-address
;; returns: boolean
(define (is-tx-from-factory)
  (let ((address
         (get address
              (expects! (fetch-entry factory-address ((id 0)))
                        'false))))
    (eq? tx-sender address)))

;; Gets the owner of the specified rocket ID
;; args:
;; @rocket-id (int) the id of the rocket to identify
;; returns: option<principal>
(define (owner-of (rocket-id int))
  (get owner
    (fetch-entry rockets-info ((rocket-id rocket-id)))))

;;; Public functions

;; Transfers rocket to a specified principal
;; Once owned, users can trade their rockets on any unregulated black market
;; args:
;; @recipient (principal) the principal of the new owner of the rocket
;; @rocket-id (int) the id of the rocket to trade
;; returns: Response<int,int>
(define-public (transfer (recipient principal) (rocket-id int))
  (let ((balance-sender (balance-of tx-sender))
        (balance-recipient (balance-of recipient)))
    (if (and
         (eq? (expects! (owner-of rocket-id) no-such-rocket-err)
              tx-sender)
         (> balance-sender 0)
         (not (eq? recipient tx-sender)))
        (begin
          (set-entry! rockets-info
                      ((rocket-id rocket-id))
                      ((owner recipient)))
          (set-entry! rockets-count
                      ((owner recipient))
                      ((count (+ balance-recipient 1))))
          (set-entry! rockets-count
                      ((owner tx-sender))
                      ((count (- balance-sender 1))))
          (ok rocket-id))
        bad-rocket-transfer-err)))

;; Mint new rockets
;; This function can only be called by the factory.
;; args:
;; @owner (principal) the principal of the owner of the new rocket
;; @rocket-id (int) the id of the rocket to mint
;; @size (int) the size of the rocket to mint
;; returns: Response<int, int>
(define-public (mint! (owner principal) (rocket-id int) (size int))
  (if (is-tx-from-factory)
      (let ((current-balance (balance-of owner)))
        (begin
          (insert-entry! rockets-info
                         ((rocket-id rocket-id))
                         ((owner owner)))
          (set-entry! rockets-count
                      ((owner owner))
                      ((count (+ 1 current-balance))))
          (ok rocket-id)))
      unauthorized-mint-err))

;; Set Factory
;; This function can only be called once.
;; args:
;; returns: Response<Principal, int>
(define-public (set-factory)
  (let ((factory-entry
         (fetch-entry factory-address ((id 0)))))
    (if (and (is-none? factory-entry)
             (insert-entry! factory-address
                            ((id 0))
                            ((address tx-sender))))
        (ok tx-sender)
        factory-already-set-err)))
