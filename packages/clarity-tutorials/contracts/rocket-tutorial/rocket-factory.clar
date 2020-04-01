;;  Copyright: (c) 2013-2019 by Blockstack PBC, a public benefit corporation.

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

;;;; Rocket-Factory

;;; Storage
(define-map orderbook
  ((buyer principal))
  ((rocket-id int) (ordered-at-block int) (ready-at-block int) (balance int) (size int)))
(define-data-var last-rocket-id int 99)

;;; Constants
(define-constant funds-address 'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR)
(define-constant not-enough-tokens-err (err 1))
(define-constant invalid-or-duplicate-order-err (err 2))
(define-constant no-order-on-books-err (err 3))
(define-constant order-fulfillment-err (err 4))

;;; Internals

;; Fetch, increment, update and return new rocket-id
;; returns: int
(define-private (new-rocket-id)
  (let ((rocket-id
      (+ 1 (var-get last-rocket-id))))
    (begin (var-set last-rocket-id rocket-id)
      rocket-id)))

;; Check if a given user can buy a new rocket
;; args:
;; @user (principal) the principal of the user
;; returns: boolean
(define-private (can-user-buy (user principal))
  (let ((ordered-at-block
      (get ordered-at-block
        (print (map-get? orderbook {buyer (print user)})))))
      (is-none ordered-at-block)
  )
)

;; Check if a given user can claim a rocket previously ordered
;; args:
;; @user (principal) the principal of the user
;; returns: boolean
(define-private (can-user-claim (user principal))
  (let ((ready-at-block
      ;; shallow-return 'false if entry doesn't exist
      (unwrap! (get ready-at-block
        (map-get? orderbook {buyer user})) 'false)))
    (>= (to-int block-height) ready-at-block)))

;; Order a rocket
;; User not present in the orderbook have the ability to buy a new rocket.
;; New rockets can be acquired using RKT tokens, price being a function of the size (size 5 = 5 RKT).
;; Building a rocket takes time - it takes 10 blocks to build a rocket of size 10.
;; Once the rocket is ready, users can get their rocket by calling the function "claim-rocket".
;; args:
;; @size (int) the size of the rocket (1 < size <= 20)
;; returns: Response<int, int>
(define-public (order-rocket (size int))
(begin
  (print (map-get? orderbook ((buyer tx-sender))))
  (let ((down-payment (/ size 2))
    (rocket-id (new-rocket-id)))
    (if (and
          (> size 1)
          (<= size 20)
          (can-user-buy tx-sender))
      (if (and
           (is-ok (contract-call? .rocket-token transfer-token funds-address (to-uint down-payment)))
           (print (map-insert orderbook
             {buyer tx-sender}
             {
               rocket-id rocket-id
               ordered-at-block (to-int block-height)
               ready-at-block (+ (to-int block-height) size)
               size size
               balance (- size down-payment)}
            )))
          (begin
            (print tx-sender)
            (print (map-get? orderbook ((buyer tx-sender))))
            (print rocket-id)
            (print down-payment)
            (ok (var-get last-rocket-id))
          )
          not-enough-tokens-err)
      invalid-or-duplicate-order-err))))

;; Claim a rocket
;; This function can only be executed when the rocket is ready.
;; By executing this function, the user will consent to pay the remaining balance.
;; In returns, a new rocket will receive a freshly minted rocket.
;; returns: Response<int, int>
(define-public (claim-rocket)
(begin
  (print tx-sender)
  (print (map-get? orderbook ((buyer tx-sender))))
  (print (map-get? orderbook {buyer tx-sender}))
  (let ((order-entry
         (unwrap! (map-get? orderbook ((buyer tx-sender)))
                   no-order-on-books-err)))
    (let ((buyer     tx-sender)
          (balance   (get balance order-entry))
          (size      (get size order-entry))
          (rocket-id (get rocket-id order-entry)))
      (if (and (can-user-claim buyer)
               (is-ok (contract-call? .rocket-token transfer-token funds-address (to-uint balance)))
               (is-ok (as-contract (contract-call? .rocket-market mint tx-sender rocket-id size )))
               (map-delete orderbook ((buyer buyer))))
          (ok rocket-id)
          order-fulfillment-err))))
)

;; Initialize the contract by
;; - taking ownership of rocket-market's mint function
(begin
  (as-contract (contract-call? .rocket-market set-factory)))
