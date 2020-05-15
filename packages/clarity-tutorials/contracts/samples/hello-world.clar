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
