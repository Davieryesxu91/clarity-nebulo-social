;; Nebulo Social Network Contract

;; Constants 
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-insufficient-balance (err u103))

;; Define token
(define-fungible-token nebu-token)

;; Data structures
(define-map profiles
    principal
    {
        name: (string-ascii 64),
        bio: (string-ascii 256),
        joined-at: uint
    }
)

(define-map posts
    uint
    {
        author: principal,
        content: (string-ascii 280),
        tips: uint,
        created-at: uint
    }
)

(define-map following
    {follower: principal, followed: principal}
    bool
)

;; Data vars
(define-data-var post-id-counter uint u0)

;; Token functions
(define-public (tip-post (post-id uint) (amount uint))
    (let (
        (post (unwrap! (map-get? posts post-id) err-not-found))
        (author (get author post))
    )
    (if (>= (ft-get-balance nebu-token tx-sender) amount)
        (begin
            (try! (ft-transfer? nebu-token amount tx-sender author))
            (map-set posts post-id 
                (merge post {tips: (+ (get tips post) amount)}))
            (ok true)
        )
        err-insufficient-balance
    ))
)

;; Profile functions
(define-public (create-profile (name (string-ascii 64)) (bio (string-ascii 256)))
    (begin
        (map-set profiles tx-sender
            {
                name: name,
                bio: bio,
                joined-at: block-height
            }
        )
        (ok true)
    )
)

(define-read-only (get-profile (user principal))
    (ok (map-get? profiles user))
)

;; Post functions
(define-public (create-post (content (string-ascii 280)))
    (let (
        (post-id (var-get post-id-counter))
    )
    (begin
        (map-set posts post-id
            {
                author: tx-sender,
                content: content,
                tips: u0,
                created-at: block-height
            }
        )
        (var-set post-id-counter (+ post-id u1))
        (ok post-id)
    ))
)

(define-read-only (get-post (post-id uint))
    (ok (map-get? posts post-id))
)

;; Following functions
(define-public (follow-user (user principal))
    (begin
        (map-set following {follower: tx-sender, followed: user} true)
        (ok true)
    )
)

(define-public (unfollow-user (user principal))
    (begin
        (map-set following {follower: tx-sender, followed: user} false)
        (ok true)
    )
)

(define-read-only (is-following (follower principal) (followed principal))
    (default-to false (map-get? following {follower: follower, followed: followed}))
)

;; Token management
(define-public (mint (amount uint) (recipient principal))
    (if (is-eq tx-sender contract-owner)
        (ft-mint? nebu-token amount recipient)
        err-owner-only
    )
)

(define-read-only (get-balance (account principal))
    (ok (ft-get-balance nebu-token account))
)