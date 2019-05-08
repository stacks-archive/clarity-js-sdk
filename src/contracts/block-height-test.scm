(define-map height-info ((key int)) ((height int)))

(define (get-height-info (key int))
    (let 
        ((height (get height 
            (fetch-entry height-info (tuple (key key))))))
        (if (eq? height 'null) 0 height)))

(define (get-current-block-height)
    block-height)

(define (print-current-block-height)
  (begin (print block-height) block-height)
)

(define-public (print-current-block-height-public)
  (begin (print block-height) 'true)
)

(define height-at-launch block-height)
(define time-at-launch 1557237920)
(define block-time (* 60 10))

(define (estimate-current-timestamp)
  (+ time-at-launch 
    (* (- block-height height-at-launch) block-time)))

(begin
    (set-entry! height-info 
        (tuple (key 123))
        (tuple (height block-height)))
    'null)
