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

;;;; Rocket-Token

;;; Storage
(define-map balances 
  ((owner principal)) 
  ((balance int)))
(define-map total-supply
  ((id int))
  ((value int)))

;;; Internals

;; Gets the total number of tokens in existence
;; returns: int
(define (get-total-supply)
  (get value 
    (fetch-entry total-supply (tuple (id 0)))))

;; Gets the amount of tokens owned by the specified address
;; args:
;; @account (principal) the principal of the user
;; returns: int
(define (balance-of (account principal))
  (let ((balance
      (get balance 
        (fetch-entry balances (tuple (owner account))))))
    (if (eq? balance 'null) 0 balance)))

;; Credits balance of a specified principal
;; args:
;; @account (principal) the principal of the account to credit
;; @amount (int) the amount of tokens to credit
;; returns: boolean
(define (credit-balance! (account principal) (amount int))
  (if (<= amount 0)
    'false
    (let ((current-balance (balance-of account)))
      (begin
        (set-entry! balances 
          (tuple (owner account))
          (tuple (balance (+ amount current-balance)))) 
        'true)))) ;; Overflow management?

;; Debits balance of a specified principal
;; args:
;; @account (principal) the principal of the account to debit
;; @amount (int) the amount of tokens to debit
;; returns: boolean
(define (debit-balance! (account principal) (amount int))
  (let ((balance (balance-of account)))
    (if (or (> amount balance) (<= amount 0))
      'false
      (begin
        (set-entry! balances
          (tuple (owner account))
          (tuple (balance (- balance amount))))
        'true))))

;; Transfers tokens to a specified principal
;; args:
;; @sender (principal) the principal of the account to debit
;; @recipient (principal) the principal of the account to credit
;; @amount (int) the amount of tokens to transfer
;; returns: boolean
(define (transfer! (sender principal) (recipient principal) (amount int))
  (if (and  
        (not (eq? sender recipient)) 
        (debit-balance! sender amount) 
        (credit-balance! recipient amount)) 
    'true
    'false))

;;; Public functions

;; Transfers tokens to a specified principal
;; args:
;; @recipient (principal) the principal of the account to credit
;; @amount (int) the amount of tokens to transfer
;; returns: boolean
(define-public (transfer (recipient principal) (amount int))
  (transfer! tx-sender recipient amount))

;; Mint new tokens
;; args:
;; @account (principal) the principal of the account owning the new tokens
;; @amount (int) the amount of tokens to transfer
;; returns: boolean
(define (mint! (account principal) (amount int))
  (if (<= amount 0)
    'false
    (let ((balance (balance-of account)))
      (begin 
        (set-entry! balances
          (tuple (owner account))
          (tuple (balance (+ balance amount))))
        (set-entry! total-supply 
          (tuple (id 0))
          (tuple (value (+ (get-total-supply) amount)))) 
        'true))))

;; Initialize the contract
(begin
  (set-entry! total-supply 
    (tuple (id 0))
    (tuple (value 0))) 
  (mint! 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 20) ;; Alice
  (mint! 'S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE 10) ;; Bob

  'null)
