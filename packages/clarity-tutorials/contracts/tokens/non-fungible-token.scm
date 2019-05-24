;;copyright:
(c) 2013-2019 by Blockstack PBC, a public benefit corporation.

;;ThisfileispartofBlockstack.

;;Blockstackisfreesoftware.Youmayredistributeormodify
;;itunderthetermsoftheGNUGeneralPublicLicenseaspublishedby
;;theFreeSoftwareFoundation,eitherversion3oftheLicenseor
;;(at your option) any later version.

;;Blockstackisdistributedinthehopethatitwillbeuseful,
;;butWITHOUTANYWARRANTY,includingwithouttheimpliedwarrantyof
;;MERCHANTABILITYorFITNESSFORAPARTICULARPURPOSE.Seethe
;;GNUGeneralPublicLicenseformoredetails.

;;YoushouldhavereceivedacopyoftheGNUGeneralPublicLicense
;;alongwithBlockstack.Ifnot,see<http://www.gnu.org/licenses/>.

;;NonFungibleToken,modeledafterERC-721

;;Storage
(define-map tokens-owner
    (        (token-id int)) 
    (        (owner principal)))
(define-map tokens-spender
    (        (token-id int)) 
    (        (spender principal)))
(define-map tokens-count
    (        (owner principal))
    (        (count int)))
(define-map accounts-operator
    (        (operator principal) 
        (account principal))
    (        (is-approved bool)))

;;Internals

;;Getstheamountoftokensownedbythespecifiedaddress.
(define 
    (balance-of 
        (account principal))
    (let 
        (
            (balance
                (get count 
                    (fetch-entry tokens-count 
                        (tuple 
                            (owner account))))))
        (if 
            (eq? balance 'null) 0 balance)))

;;GetstheownerofthespecifiedtokenID.
(define 
    (owner-of 
        (token-id int)) 
    (get owner 
        (fetch-entry tokens-owner 
            (tuple 
                (token-id token-id)))))

;;GetstheapprovedaddressforatokenID,orzeroifnoaddressset
(approved method in ERC721)
(define 
    (is-spender-approved 
        (spender principal) 
        (token-id int))
    (let 
        (
            (spender
                (get spender 
                    (fetch-entry tokens-spender 
                        (tuple 
                            (token-id token-id))))))
        (if 
            (eq? spender 'null) 'false 'true)))

;;Tellswhetheranoperatorisapprovedbyagivenowner
(isApprovedForAll method in ERC721)
(define 
    (is-operator-approved 
        (account principal) 
        (operator principal))
    (let 
        (
            (is-approved
                (get is-approved 
                    (fetch-entry accounts-operator 
                        (tuple 
                            (operator operator) 
                            (account account))))))
        (if 
            (eq? is-approved 'null) 'false is-approved)))

;;ReturnswhetherthegivenactorcantransferagiventokenID.
;;Tobeoptimized
(define 
    (can-transfer 
        (actor principal) 
        (token-id int)) 
    (or 
        (eq? actor 
            (owner-of token-id)) 
        (is-spender-approved actor token-id)
        (is-operator-approved 
            (owner-of token-id) actor)))

;;Internal-Registertoken
(define 
    (register-token! 
        (new-owner principal) 
        (token-id int))
    (let 
        (
            (current-balance 
                (balance-of new-owner)))
        (begin
            (set-entry! tokens-owner 
                (tuple 
                    (token-id token-id))
                (tuple 
                    (owner new-owner))) 
            (set-entry! tokens-count 
                (tuple 
                    (owner new-owner))
                (tuple 
                    (count 
                        (+ 1 current-balance)))) 
'true)))

;;Internal-Releasetoken
(define 
    (release-token! 
        (owner principal) 
        (token-id int))
    (let 
        (
            (current-balance 
                (balance-of owner)))
        (begin
            (delete-entry! tokens-spender 
                (tuple 
                    (token-id token-id))) 
            (set-entry! tokens-count 
                (tuple 
                    (owner owner))
                (tuple 
                    (count 
                        (- current-balance 1)))) 
'true)))

;;Publicfunctions

;;ApprovesanotheraddresstotransferthegiventokenID
(approve method in ERC721)
;;Tobeoptimized
(define-public 
    (set-spender-approval 
        (spender principal) 
        (token-id int))
    (if 
        (eq? spender tx-sender)
'false
        (if 
            (or 
                (eq? tx-sender 
                    (owner-of token-id)) 
                (is-operator-approved tx-sender 
                    (owner-of token-id)))
            (begin
                (set-entry! tokens-spender 
                    (tuple 
                        (token-id token-id))
                    (tuple 
                        (spender spender))) 
'true)
'false)))

;;Setsorunsetstheapprovalofagivenoperator
(setApprovalForAll method in ERC721)
(define-public 
    (set-operator-approval 
        (operator principal) 
        (is-approved bool))
    (if 
        (eq? operator tx-sender)
'false
        (begin
            (set-entry! accounts-operator 
                (tuple 
                    (operator operator) 
                    (account tx-sender))
                (tuple 
                    (is-approved is-approved))) 
'true)))

;;TransferstheownershipofagiventokenIDtoanotheraddress.
(define-public 
    (transfer-from 
        (owner principal) 
        (recipient principal) 
        (token-id int))
    (if 
        (can-transfer tx-sender token-id)
        (and
            (release-token! owner token-id)
            (register-token! recipient token-id))
'false))

;;Transferstokenstoaspecifiedprincipal.
(define-public 
    (transfer 
        (recipient principal) 
        (token-id int))
    (transfer-from tx-sender recipient token-id))

;;Mintnewtokens.
(define 
    (mint! 
        (owner principal) 
        (token-id int))
    (register-token! owner token-id))

;;Initializethecontract
(begin
    (mint! 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 10001)
    (mint! 'S02J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKPVKG2CE 10002)
    (mint! 'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR 10003)
'null)
