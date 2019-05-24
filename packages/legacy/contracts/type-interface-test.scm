(define example-null-const 'null)
(define (get-null-var) 'null)
(define (echo-null-var (a void)) a)
(define-public (check-null-input (a int)) (isnull? a))
