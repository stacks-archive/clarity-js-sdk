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

(define-fungible-token rocket-token)

(define-public (transfer-token (receiver principal) (amount uint))
  (begin
    (print amount)
    (ft-transfer? rocket-token amount tx-sender receiver)
  )
)

;; Initialize the contract
(begin
  (ft-mint? rocket-token u20 'ST398K1WZTBVY6FE2YEHM6HP20VSNVSSPJTW0D53M) ;; Alice
)
