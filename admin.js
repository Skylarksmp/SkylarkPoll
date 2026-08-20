import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyAnkbOkah3JjBe_9lsYYMinMXzY5VlLfL4",
    authDomain: "skylark-staff-application.firebaseapp.com",
    projectId: "skylark-staff-application",
    storageBucket: "skylark-staff-application.firebasestorage.app",
    messagingSenderId: "877610328379",
    appId: "1:877610328379:web:8d0a892bad042875de971e"
};


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

let app;
let auth;
let db;
let provider;

try {

    app = initializeApp(firebaseConfig);

    auth = getAuth(app);

    db = getFirestore(app);

    provider = new GoogleAuthProvider();

    provider.setCustomParameters({
        prompt: "select_account"
    });

    console.log(
        "✅ Firebase initialized"
    );

} catch (error) {

    console.error(
        "❌ Firebase initialization failed:",
        error
    );

    showError(
        error
    );

}


/* =====================================================
   ADMIN EMAILS
===================================================== */

const ADMIN_EMAILS = [

    "xianytcontent@gmail.com",

    "deinnieldeinn@gmail.com",

    "keithledesma13@gmail.com",

    "mtzy6764@gmail.com"

];


/* =====================================================
   GET HTML ELEMENTS
===================================================== */

const loginScreen =
    document.getElementById(
        "loginScreen"
    );

const adminPanel =
    document.getElementById(
        "adminPanel"
    );

const googleLogin =
    document.getElementById(
        "googleLogin"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const loginMessage =
    document.getElementById(
        "loginMessage"
    );

const adminEmail =
    document.getElementById(
        "adminEmail"
    );

const createPollButton =
    document.getElementById(
        "createPoll"
    );

const pollQuestion =
    document.getElementById(
        "pollQuestion"
    );

const pollOptions =
    document.getElementById(
        "pollOptions"
    );

const adminPolls =
    document.getElementById(
        "adminPolls"
    );


/* =====================================================
   SHOW MESSAGE
===================================================== */

function setMessage(
    text
) {

    console.log(
        "SKYLARK:",
        text
    );

    if (loginMessage) {

        loginMessage.textContent =
            text;

    }

}


/* =====================================================
   SHOW ERROR
===================================================== */

function showError(
    error
) {

    console.error(
        error
    );

    const code =
        error?.code ||
        "unknown-error";

    const message =
        error?.message ||
        String(error);

    setMessage(
        "❌ " +
        code +
        ": " +
        message
    );

}


/* =====================================================
   CHECK ADMIN
===================================================== */

function isAdmin(
    email
) {

    if (!email) {

        return false;

    }

    return ADMIN_EMAILS.includes(
        email
            .toLowerCase()
            .trim()
    );

}


/* =====================================================
   SHOW LOGIN SCREEN
===================================================== */

function showLogin() {

    if (loginScreen) {

        loginScreen.style.display =
            "flex";

    }

    if (adminPanel) {

        adminPanel.style.display =
            "none";

    }

}


/* =====================================================
   SHOW ADMIN PANEL
===================================================== */

function showAdminPanel(
    user
) {

    if (!user) {

        showLogin();

        return;

    }


    console.log(
        "Signed in account:",
        user.email
    );


    if (!isAdmin(user.email)) {

        setMessage(
            "❌ Unauthorized account: " +
            user.email
        );

        if (adminPanel) {

            adminPanel.style.display =
                "none";

        }

        if (loginScreen) {

            loginScreen.style.display =
                "flex";

        }

        return;

    }


    if (loginScreen) {

        loginScreen.style.display =
            "none";

    }

    if (adminPanel) {

        adminPanel.style.display =
            "block";

    }


    if (adminEmail) {

        adminEmail.textContent =
            user.email;

    }


    setMessage(
        "✅ Admin authenticated."
    );


    loadPolls();

}


/* =====================================================
   GOOGLE LOGIN
===================================================== */

if (googleLogin) {

    googleLogin.addEventListener(
        "click",
        async () => {

            console.log(
                "Google Login clicked"
            );


            if (!auth || !provider) {

                setMessage(
                    "❌ Firebase Auth is not initialized."
                );

                return;

            }


            googleLogin.disabled =
                true;

            googleLogin.textContent =
                "Opening Google...";


            setMessage(
                "🔄 Opening Google..."
            );


            try {

                await signInWithRedirect(
                    auth,
                    provider
                );

            } catch (error) {

                showError(
                    error
                );


                googleLogin.disabled =
                    false;

                googleLogin.textContent =
                    "Continue with Google";

            }

        }
    );

} else {

    console.error(
        "❌ #googleLogin was not found."
    );

}


/* =====================================================
   GOOGLE REDIRECT RESULT
===================================================== */

if (auth) {

    getRedirectResult(
        auth
    )

        .then(
            result => {

                if (!result) {

                    console.log(
                        "No new Google redirect."
                    );

                    return;

                }


                console.log(
                    "✅ Google redirect successful"
                );


                showAdminPanel(
                    result.user
                );

            }
        )

        .catch(
            error => {

                showError(
                    error
                );

            }
        );

}


/* =====================================================
   AUTH STATE
===================================================== */

if (auth) {

    onAuthStateChanged(
        auth,
        user => {

            console.log(
                "Auth state:",
                user
                    ? user.email
                    : "logged out"
            );


            if (!user) {

                showLogin();

                return;

            }


            showAdminPanel(
                user
            );

        }
    );

}


/* =====================================================
   LOGOUT
===================================================== */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );

                showLogin();

                setMessage(
                    "You have been logged out."
                );

            } catch (error) {

                showError(
                    error
                );

            }

        }
    );

}


/* =====================================================
   CREATE POLL
===================================================== */

if (createPollButton) {

    createPollButton.addEventListener(
        "click",
        async () => {

            if (!auth.currentUser) {

                alert(
                    "You must be logged in."
                );

                return;

            }


            if (
                !isAdmin(
                    auth.currentUser.email
                )
            ) {

                alert(
                    "❌ You are not an authorized admin."
                );

                return;

            }


            const question =
                pollQuestion.value.trim();


            const optionText =
                pollOptions.value.trim();


            if (!question) {

                alert(
                    "Please enter a poll question."
                );

                return;

            }


            const optionLines =
                optionText

                    .split("\n")

                    .map(
                        option =>
                            option.trim()
                    )

                    .filter(
                        option =>
                            option.length > 0
                    );


            if (
                optionLines.length < 2
            ) {

                alert(
                    "Please enter at least 2 options."
                );

                return;

            }


            const options =
                optionLines.map(
                    option => ({

                        text:
                            option,

                        votes:
                            0

                    })
                );


            try {

                createPollButton.disabled =
                    true;

                createPollButton.textContent =
                    "Creating...";


                await addDoc(
                    collection(
                        db,
                        "polls"
                    ),
                    {

                        question:
                            question,

                        options:
                            options,

                        active:
                            true,

                        createdAt:
                            serverTimestamp(),

                        createdBy:
                            auth.currentUser.email

                    }
                );


                pollQuestion.value =
                    "";

                pollOptions.value =
                    "";


                alert(
                    "✅ Poll created successfully!"
                );


            } catch (error) {

                alert(
                    "❌ " +
                    error.code +
                    "\n\n" +
                    error.message
                );


                console.error(
                    "CREATE POLL ERROR:",
                    error
                );

            } finally {

                createPollButton.disabled =
                    false;

                createPollButton.textContent =
                    "Create Poll";

            }

        }
    );

}


/* =====================================================
   LOAD POLLS
===================================================== */

function loadPolls() {

    if (!adminPolls) {

        return;

    }


    if (!db) {

        adminPolls.innerHTML = `

            <div class="empty-polls">

                <h3>
                    ❌ Firestore unavailable
                </h3>

                <p>
                    Firebase was not initialized.
                </p>

            </div>

        `;

        return;

    }


    onSnapshot(

        collection(
            db,
            "polls"
        ),

        snapshot => {

            adminPolls.innerHTML =
                "";


            if (snapshot.empty) {

                adminPolls.innerHTML = `

                    <div class="empty-polls">

                        <h3>
                            No Polls Yet
                        </h3>

                        <p>
                            Create your first Skylark poll.
                        </p>

                    </div>

                `;

                return;

            }


            snapshot.forEach(
                pollDoc => {

                    renderPoll(
                        pollDoc.id,
                        pollDoc.data()
                    );

                }
            );

        },

        error => {

            console.error(
                "FIRESTORE ERROR:",
                error
            );


            adminPolls.innerHTML = `

                <div class="empty-polls">

                    <h3>
                        ❌ Firestore Error
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.code
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }

    );

}


/* =====================================================
   RENDER POLL
===================================================== */

function renderPoll(
    id,
    poll
) {

    const options =
        Array.isArray(
            poll.options
        )
            ? poll.options
            : [];


    const totalVotes =
        options.reduce(
            (
                total,
                option
            ) => {

                return (
                    total +
                    Number(
                        option.votes || 0
                    )
                );

            },
            0
        );


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "admin-poll-card";


    let optionsHTML =
        "";


    options.forEach(
        option => {

            optionsHTML += `

                <div class="admin-option">

                    <span>
                        ${escapeHTML(
                            option.text
                        )}
                    </span>

                    <strong>
                        ${Number(
                            option.votes || 0
                        )}
                    </strong>

                </div>

            `;

        }
    );


    card.innerHTML = `

        <div class="admin-poll-header">

            <div>

                <span class="poll-status">
                    ACTIVE
                </span>

                <h3>
                    ${escapeHTML(
                        poll.question
                    )}
                </h3>

            </div>


            <button
                class="delete-poll"
                type="button"
            >
                Delete
            </button>

        </div>


        <div class="admin-options">

            ${optionsHTML}

        </div>


        <div class="admin-total">

            Total Votes:

            <strong>
                ${totalVotes}
            </strong>

        </div>

    `;


    adminPolls.appendChild(
        card
    );


    const deleteButton =
        card.querySelector(
            ".delete-poll"
        );


    deleteButton.addEventListener(
        "click",
        () => {

            deletePoll(
                id
            );

        }
    );

}


/* =====================================================
   DELETE POLL
===================================================== */

async function deletePoll(
    pollId
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this poll?\n\nThis cannot be undone."
        );


    if (!confirmed) {

        return;

    }


    if (!auth.currentUser) {

        alert(
            "You are not logged in."
        );

        return;

    }


    if (
        !isAdmin(
            auth.currentUser.email
        )
    ) {

        alert(
            "❌ You are not authorized."
        );

        return;

    }


    try {

        await deleteDoc(

            doc(
                db,
                "polls",
                pollId
            )

        );


        alert(
            "✅ Poll deleted."
        );


    } catch (error) {

        console.error(
            "DELETE ERROR:",
            error
        );


        alert(
            "❌ " +
            error.code +
            "\n\n" +
            error.message
        );

    }

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(
    value
) {

    return String(
        value
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   READY
===================================================== */

console.log(
    "🟣 Skylark Admin JS loaded successfully."
);

setMessage(
    "Firebase loaded — ready to login."
);
