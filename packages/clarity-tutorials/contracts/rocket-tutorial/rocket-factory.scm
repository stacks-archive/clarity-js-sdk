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

;; Rocket-Factory

;; Storage
(define-map current-orders
  ((buyer principal))
  ((rocket-id int) (ordered-at-block int) (ready-at-block int) (balance int) (size int)))
(define-map auto-increments
  ((id int))
  ((value int)))
(define funds-address 'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR)

(define (new-rocket-id)
  (let ((rocket-id
      (+ 1 (get value (fetch-entry auto-increments (tuple (id 0)))))))
    (begin (set-entry! auto-increments
      (tuple (id 0))
      (tuple (value rocket-id)))
    rocket-id)))

;; Check if a given user can buy
(define (can-user-buy (user principal))
  (let ((ordered-at-block
      (get ordered-at-block 
        (fetch-entry current-orders (tuple (buyer user))))))
    (if (eq? ordered-at-block 'null) 'true 'false)))

;; Check if a given order is ready
(define (can-user-claim (user principal))
  (let ((ready-at-block
      (get ready-at-block 
        (fetch-entry current-orders (tuple (buyer user))))))
    (>= block-height ready-at-block)))

;; Check if a given order is ready
(define (rocket-claimable-at (user principal))
  (get ready-at-block 
    (fetch-entry current-orders (tuple (buyer user)))))

;; Buy a rocket. 
(define-public (buy-rocket (size int))
  (let ((down-payment (/ size 2)))
    (and 
      (can-user-buy tx-sender)
      (contract-call! rocket-token transfer funds-address down-payment)
      (insert-entry! current-orders
        (tuple (buyer tx-sender))
        (tuple 
          (rocket-id (new-rocket-id))
          (ordered-at-block block-height) 
          (ready-at-block (+ block-height size)) 
          (size size)
          (balance (- size down-payment)))))))

;; Claim a rocket. 
(define-public (claim-rocket)
  (let ((buyer tx-sender)
        (balance
          (get balance 
            (fetch-entry current-orders (tuple (buyer tx-sender)))))
        (size
          (get size 
            (fetch-entry current-orders (tuple (buyer tx-sender)))))

        (rocket-id
          (get rocket-id 
            (fetch-entry current-orders (tuple (buyer tx-sender))))))
    (and 
      (can-user-claim tx-sender)
      (contract-call! rocket-token transfer funds-address balance)
      (as-contract (contract-call! rocket-market mint! buyer rocket-id size))
      (delete-entry! current-orders (tuple (buyer tx-sender))))))

;; Initialize the contract
(begin
  (set-entry! auto-increments 
    (tuple (id 0))
    (tuple (value 0))) 
  (as-contract (contract-call! rocket-market set-factory))
  'null)
