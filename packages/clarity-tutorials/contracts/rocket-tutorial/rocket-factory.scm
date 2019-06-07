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
(define-map auto-increments
  ((id int))
  ((value int)))

;;; Constants
(define funds-address 'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR)
(define not-enough-tokens-err (err 1))
(define invalid-or-duplicate-order-err (err 2))
(define no-order-on-books-err (err 3))
(define order-fulfillment-err (err 4))

;;; Internals

(define (current-rocket-id)
  (default-to 0
    (get value (fetch-entry auto-increments (tuple (id 0))))))

;; Fetch, increment, update and return new rocket-id 
;; returns: int
(define (new-rocket-id)
  (let ((rocket-id
      (+ 1 (current-rocket-id))))
    (begin (set-entry! auto-increments
      (tuple (id 0))
      (tuple (value rocket-id)))
    rocket-id)))

;; Check if a given user can buy a new rocket
;; args:
;; @user (principal) the principal of the user
;; returns: boolean
(define (can-user-buy (user principal))
  (let ((ordered-at-block
      (get ordered-at-block 
        (fetch-entry orderbook (tuple (buyer user))))))
    (if (is-none? ordered-at-block) 'true 'false)))

;; Check if a given user can claim a rocket previously ordered
;; args:
;; @user (principal) the principal of the user
;; returns: boolean
(define (can-user-claim (user principal))
  (let ((ready-at-block
      ;; shallow-return 'false if entry doesn't exist
      (expects! (get ready-at-block 
        (fetch-entry orderbook (tuple (buyer user)))) 'false)))
    (>= block-height ready-at-block)))

;; Order a rocket
;; User not present in the orderbook have the ability to buy a new rocket.
;; New rockets can be acquired using RKT tokens, price being a function of the size (size 5 = 5 RKT).
;; Building a rocket takes time - it takes 10 blocks to build a rocket of size 10.
;; Once the rocket is ready, users can get their rocket by calling the function "claim-rocket".
;; args:
;; @size (int) the size of the rocket (1 < size <= 20)
;; returns: Response<int, int>
(define-public (order-rocket (size int))
  (let ((down-payment (/ size 2)))
    (if (and 
          (> size 1)
          (<= size 20)
          (can-user-buy tx-sender))
      (if (and
           (is-ok? (contract-call! rocket-token transfer funds-address down-payment))
           (insert-entry! orderbook
             (tuple (buyer tx-sender))
             (tuple 
               (rocket-id (new-rocket-id))
               (ordered-at-block block-height) 
               (ready-at-block (+ block-height size)) 
               (size size)
               (balance (- size down-payment)))))
          (ok (current-rocket-id))
          not-enough-tokens-err)
      invalid-or-duplicate-order-err)))

;; Claim a rocket
;; This function can only be executed when the rocket is ready.
;; By executing this function, the user will consent to pay the remaining balance.
;; In returns, a new rocket will receive a freshly minted rocket. 
;; returns: Response<int, int>
(define-public (claim-rocket)
  (let ((order-entry
         (expects! (fetch-entry orderbook (tuple (buyer tx-sender)))
                   no-order-on-books-err)))
    (let ((buyer     tx-sender)
          (balance   (get balance order-entry))
          (size      (get size order-entry))
          (rocket-id (get rocket-id order-entry))) 
      (if (and (can-user-claim buyer)
               (is-ok? (contract-call! rocket-token transfer funds-address balance))
               (is-ok? (as-contract (contract-call! rocket-market mint! buyer rocket-id size)))
               (delete-entry! orderbook (tuple (buyer buyer))))
          (ok rocket-id)
          order-fulfillment-err))))

;; Initialize the contract by
;; - initializing auto-increments
;; - taking ownership of rocket-market's mint function
(begin
  (set-entry! auto-increments 
    (tuple (id 0))
    (tuple (value 0))) 
  (as-contract (contract-call! rocket-market set-factory)))
