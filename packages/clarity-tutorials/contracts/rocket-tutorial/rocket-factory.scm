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
  ((ordered-at-block int) (ready-at-block int) (claimed bool)))

(define funds-address 'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR)

;; Check if a given user can buy
(define (can-user-buy (user principal))
  (let ((ordered-at-block
      (get ordered-at-block 
        (fetch-entry current-orders (tuple (buyer user))))))
    (if (eq? ordered-at-block 'null) 'true 'false)))

;; Check if a given order is ready
(define (is-order-ready (user principal))
  (let ((ready-at-block
      (get ready-at-block 
        (fetch-entry current-orders (tuple (buyer user))))))
    (>= block-height ready-at-block)))

;; Buy a rocket. 
(define-public (buy-rocket (size int))
  (let ((amount-upfront (/ size 2)))
    (and 
      (can-user-buy tx-sender)
      (contract-call! rocket-token transfer funds-address amount-upfront)
      (insert-entry! current-orders
        (tuple (buyer tx-sender))
        (tuple 
          (ordered-at-block block-height) 
          (ready-at-block (+ block-height size)) 
          (claimed 'false))))))

;; (define-public (register 
;;                 (recipient-principal principal)
;;                 (name int)
;;                 (salt int))
;;   (let ((preorder-entry
;;          (fetch-entry preorder-map
;;                       (tuple (name-hash (hash160 (xor name salt))))))
;;         (name-entry 
;;          (fetch-entry name-map (tuple (name name)))))
;;     (if (and
;;          ;; must be preordered
;;          (not (eq? preorder-entry 'null))
;;          ;; name shouldn't *already* exist
;;          (eq? name-entry 'null)
;;          ;; preorder must have paid enough
;;          (<= (price-function name) 
;;              (get paid preorder-entry))
;;          ;; preorder must have been the current principal
;;          (eq? tx-sender
;;               (get buyer preorder-entry)))
;;         (and
;;          (insert-entry! name-map
;;                         (tuple (name name))
;;                         (tuple (owner recipient-principal)))
;;          (delete-entry! preorder-map
;;                         (tuple (name-hash (hash160 (xor name salt))))))
;;         'false)))


;; maybe it's a function of rocket size and price paid
;; so like, I can get a size 10 rocket in 1 block if I pay 10 stacks
;; or I can get a size 10 rocket in 10 blocks if I pay 1 stack