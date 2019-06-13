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

;; Non Fungible Token, modeled after ERC-721

;; Storage
(define-map tokens-owner
  ((token-id int))
  ((owner principal)))
(define-map tokens-spender
  ((token-id int))
  ((spender principal)))
(define-map tokens-count
  ((owner principal))
  ((count int)))
(define-map accounts-operator
  ((operator principal) (account principal))
  ((is-approved bool)))

;; Internals

;; Gets the amount of tokens owned by the specified address.
(define (balance-of (account principal))
  (default-to 0
    (get count
         (fetch-entry tokens-count ((owner account))))))

;; Gets the owner of the specified token ID.
(define (owner-of (token-id int))
  (get owner
    (fetch-entry tokens-owner ((token-id token-id)))))

;; Gets the approved address for a token ID, or zero if no address set (approved method in ERC721)
(define (is-spender-approved (spender principal) (token-id int))
  (let ((approved-spender
         (expects! (get spender
                        (fetch-entry tokens-spender ((token-id token-id))))
                   'false))) ;; return false if no specified spender
    (eq? spender approved-spender)))

;; Tells whether an operator is approved by a given owner (isApprovedForAll method in ERC721)
(define (is-operator-approved (account principal) (operator principal))
  (default-to 'false
    (get is-approved
         (fetch-entry accounts-operator ((operator operator) (account account))))))

(define (is-owner (actor principal) (token-id int))
  (eq? actor
       ;; if no owner, return false
       (expects! (owner-of token-id) 'false)))

;; Returns whether the given actor can transfer a given token ID.
;; To be optimized
(define (can-transfer (actor principal) (token-id int))
  (or
   (is-owner actor token-id)
   (is-spender-approved actor token-id)
   (is-operator-approved (expects! (owner-of token-id) 'false) actor)))

;; Internal - Register token
(define (register-token! (new-owner principal) (token-id int))
  (let ((current-balance (balance-of new-owner)))
    (begin
      (set-entry! tokens-owner
        ((token-id token-id))
        ((owner new-owner)))
      (set-entry! tokens-count
        ((owner new-owner))
        ((count (+ 1 current-balance))))
      'true)))

;; Internal - Release token
(define (release-token! (owner principal) (token-id int))
  (let ((current-balance (balance-of owner)))
    (begin
      (delete-entry! tokens-spender
        ((token-id token-id)))
      (set-entry! tokens-count
        ((owner owner))
        ((count (- current-balance 1))))
      'true)))

;; Public functions

(define same-spender-err (err 1))
(define not-approved-spender-err (err 2))
(define failed-to-move-token-err (err 3))
(define unauthorized-transfer-err (err 4))
(define failed-to-mint-err (err 5))

;; Approves another address to transfer the given token ID (approve method in ERC721)
;; To be optimized
(define-public (set-spender-approval (spender principal) (token-id int))
  (if (eq? spender tx-sender)
      same-spender-err
      (if (or (is-owner tx-sender token-id)
              (is-operator-approved
               (expects! (owner-of token-id) not-approved-spender-err)
               tx-sender))
          (begin
            (set-entry! tokens-spender
                        ((token-id token-id))
                        ((spender spender)))
            (ok token-id))
          not-approved-spender-err)))

;; Sets or unsets the approval of a given operator (setApprovalForAll method in ERC721)
(define-public (set-operator-approval (operator principal) (is-approved bool))
  (if (eq? operator tx-sender)
      same-spender-err
      (begin
        (set-entry! accounts-operator
                    ((operator operator) (account tx-sender))
                    ((is-approved is-approved)))
        (ok 'true))))

;; Transfers the ownership of a given token ID to another address.
(define-public (transfer-from (owner principal) (recipient principal) (token-id int))
  (if (and
        (can-transfer tx-sender token-id)
        (is-owner owner token-id)
        (not (eq? recipient owner)))
      (if
       (and (release-token! owner token-id)
            (register-token! recipient token-id))
       (ok token-id)
       failed-to-move-token-err)
      unauthorized-transfer-err))

;; Transfers tokens to a specified principal.
(define-public (transfer (recipient principal) (token-id int))
  (transfer-from tx-sender recipient token-id))

;; Mint new tokens.
(define (mint! (owner principal) (token-id int))
  (if (register-token! owner token-id)
      (ok token-id)
      failed-to-mint-err))

;; Initialize the contract
(begin
  (mint! 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 10001)
  (mint! 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 10002)
  (mint! 'S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE 10003))
