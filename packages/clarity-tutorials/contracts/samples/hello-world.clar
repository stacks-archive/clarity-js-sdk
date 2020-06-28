(define-public (say-hi)
   (ok "hello world"))

(define-public (echo-number (val int))
   (ok val))

(define-public (info (arg0 principal))
  (begin
    (print tx-sender)
    (print contract-caller)
    (print block-height)
    (print arg0)
    (ok true)
  )
)

(define-read-only (info-read-only (arg0 principal))
  {
    tx-sender: tx-sender,
    contract-caller: contract-caller,
    block-height: block-height,
    arg0: arg0,
  }
)
