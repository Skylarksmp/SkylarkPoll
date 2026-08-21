/* =====================================================
   SKYLARK NETWORK
   ADMIN PANEL
   COMPLETE ADMIN.JS
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

const firebaseConfig = {

    apiKey:
        "AIzaSyAnkbOkah3JjBe_9lsYYMinMXzY5VlLfL4",

    authDomain:
        "skylark-staff-application.firebaseapp.com",

    projectId:
        "skylark-staff-application",

    storageBucket:
        "skylark-staff-application.firebasestorage.app",

    messagingSenderId:
        "877610328379",

    appId:
        "1:877610328379:web:8d0a892bad042875de971e"

};


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app =
    initializeApp(
        firebaseConfig
    );

const auth =
    getAuth(app);

const db =
    getFirestore(app);

const provider =
    new GoogleAuthProvider();


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
   ELEMENTS
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

const createPoll =
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
   FIREBASE STATUS
===================================================== */

function showLoginMessage(
    message
) {

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent =
        message;

}


/* =====================================================
   CHECK ADMIN
===================================================== */

function isAdmin(
    user
) {

    if (!user) {
        return false;
    }

    return ADMIN_EMAILS.includes(
        user.email.toLowerCase()
    );

}


/* =====================================================
   GOOGLE LOGIN
===================================================== */

if (googleLogin) {

    googleLogin.addEventListener(
        "click",
        async () => {

            try {

                googleLogin.disabled =
                    true;

                showLoginMessage(
                    "Opening Google login..."
                );


                await signInWithPopup(
                    auth,
                    provider
                );


            } catch (error) {

                console.error(
                    "Google login error:",
                    error
                );


                showLoginMessage(
                    getAuthErrorMessage(
                        error
                    )
                );


                googleLogin.disabled =
                    false;

            }

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

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,

    (user) => {

        if (!user) {

            showLogin();

            return;

        }


        if (!isAdmin(user)) {

            showLoginMessage(
                "This Google account is not authorized."
            );


            signOut(
                auth
            );


            return;

        }


        showAdmin(
            user
        );

    }
);


/* =====================================================
   SHOW LOGIN
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


    if (adminEmail) {

        adminEmail.textContent =
            "";

    }

}


/* =====================================================
   SHOW ADMIN
===================================================== */

function showAdmin(
    user
) {

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


    showLoginMessage(
        "Firebase loaded — ready to manage polls."
    );


    loadPolls();

}


/* =====================================================
   CREATE POLL
===================================================== */

if (createPoll) {

    createPoll.addEventListener(
        "click",
        async () => {

            const question =
                pollQuestion
                    ?.value
                    ?.trim();


            const rawOptions =
                pollOptions
                    ?.value
                    ?.split("\n")
                    .map(
                        option =>
                            option.trim()
                    )
                    .filter(
                        option =>
                            option.length > 0
                    );


            if (!question) {

                alert(
                    "Please enter a poll question."
                );

                return;

            }


            if (
                !rawOptions ||
                rawOptions.length < 2
            ) {

                alert(
                    "Please enter at least 2 options."
                );

                return;

            }


            if (rawOptions.length > 10) {

                alert(
                    "You can have a maximum of 10 options."
                );

                return;

            }


            try {

                createPoll.disabled =
                    true;


                /*
                 * Automatically deactivate
                 * existing active polls.
                 */

                await closeExistingPolls();


                const options =
                    rawOptions.map(
                        text => ({

                            text: text,

                            votes: 0

                        })
                    );


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


                if (pollQuestion) {

                    pollQuestion.value =
                        "";

                }


                if (pollOptions) {

                    pollOptions.value =
                        "";

                }


                alert(
                    "Poll created successfully!"
                );


            } catch (error) {

                console.error(
                    "Create poll error:",
                    error
                );


                alert(
                    "Unable to create poll:\n\n" +
                    error.message
                );

            } finally {

                createPoll.disabled =
                    false;

            }

        }
    );

}


/* =====================================================
   CLOSE EXISTING POLLS
===================================================== */

async function closeExistingPolls() {

    /*
     * We use the current admin snapshot.
     * This keeps the create flow simple.
     */

    return new Promise(
        (resolve) => {

            const unsubscribe =
                onSnapshot(

                    collection(
                        db,
                        "polls"
                    ),

                    async (
                        snapshot
                    ) => {

                        try {

                            const updates =
                                [];


                            snapshot.forEach(
                                (
                                    pollDoc
                                ) => {

                                    const data =
                                        pollDoc.data();


                                    if (
                                        data.active === true
                                    ) {

                                        updates.push(
                                            updateDoc(
                                                doc(
                                                    db,
                                                    "polls",
                                                    pollDoc.id
                                                ),
                                                {
                                                    active:
                                                        false,

                                                    closedAt:
                                                        serverTimestamp(),

                                                    closedBy:
                                                        auth.currentUser.email
                                                }
                                            )
                                        );

                                    }

                                }
                            );


                            await Promise.all(
                                updates
                            );


                            unsubscribe();

                            resolve();

                        } catch (
                            error
                        ) {

                            unsubscribe();

                            console.error(
                                "Closing old polls error:",
                                error
                            );

                            resolve();

                        }

                    },

                    () => {

                        unsubscribe();

                        resolve();

                    }

                );

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


    onSnapshot(

        collection(
            db,
            "polls"
        ),

        (snapshot) => {

            const polls = [];


            snapshot.forEach(
                (pollDoc) => {

                    polls.push({

                        id:
                            pollDoc.id,

                        ...pollDoc.data()

                    });

                }
            );


            polls.sort(
                (
                    a,
                    b
                ) => {

                    const aTime =
                        a.createdAt
                            ?.seconds ||
                        0;

                    const bTime =
                        b.createdAt
                            ?.seconds ||
                        0;


                    return bTime - aTime;

                }
            );


            renderAdminPolls(
                polls
            );

        },

        (error) => {

            console.error(
                "Poll loading error:",
                error
            );


            adminPolls.innerHTML = `

                <div class="empty-polls">

                    <h3>
                        Unable to load polls
                    </h3>

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
   RENDER ADMIN POLLS
===================================================== */

function renderAdminPolls(
    polls
) {

    if (!adminPolls) {
        return;
    }


    if (polls.length === 0) {

        adminPolls.innerHTML = `

            <div class="empty-polls">

                <h3>
                    No polls yet
                </h3>

                <p>
                    Create your first Skylark poll above.
                </p>

            </div>

        `;

        return;

    }


    adminPolls.innerHTML =
        polls.map(
            poll => {

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

                            return total +
                                Number(
                                    option.votes ||
                                    0
                                );

                        },
                        0
                    );


                const isActive =
                    poll.active === true;


                const optionsHTML =
                    options.map(
                        (
                            option
                        ) => `

                            <div class="admin-option">

                                <span>
                                    ${escapeHTML(
                                        option.text
                                    )}
                                </span>

                                <strong>
                                    ${Number(
                                        option.votes ||
                                        0
                                    )}
                                </strong>

                            </div>

                        `
                    ).join("");


                return `

                    <div
                        class="admin-poll-card"
                        data-poll-id="${poll.id}"
                    >

                        <div class="admin-poll-header">

                            <div>

                                <span class="poll-status">

                                    ${
                                        isActive
                                            ? "ACTIVE"
                                            : "CLOSED"
                                    }

                                </span>


                                <h3>

                                    ${escapeHTML(
                                        poll.question
                                    )}

                                </h3>

                            </div>


                            <div class="poll-actions">

                                ${
                                    isActive
                                        ? `

                                            <button
                                                class="close-poll"
                                                data-id="${poll.id}"
                                            >
                                                🔒 Close
                                            </button>

                                          `
                                        : ""
                                }


                                <button
                                    class="delete-poll"
                                    data-id="${poll.id}"
                                >
                                    🗑️ Delete
                                </button>

                            </div>

                        </div>


                        <div class="admin-options">

                            ${optionsHTML}

                        </div>


                        <div class="admin-total">

                            Total votes:

                            <strong>
                                ${totalVotes}
                            </strong>

                        </div>

                    </div>

                `;

            }
        ).join("");


    attachPollButtons();

}


/* =====================================================
   POLL BUTTONS
===================================================== */

function attachPollButtons() {

    /*
     * CLOSE
     */

    const closeButtons =
        adminPolls.querySelectorAll(
            ".close-poll"
        );


    closeButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    const pollId =
                        button.dataset.id;


                    if (!pollId) {
                        return;
                    }


                    const confirmed =
                        confirm(
                            "Close this poll?\n\nPlayers will no longer be able to vote."
                        );


                    if (!confirmed) {
                        return;
                    }


                    try {

                        button.disabled =
                            true;


                        await updateDoc(
                            doc(
                                db,
                                "polls",
                                pollId
                            ),
                            {

                                active:
                                    false,

                                closedAt:
                                    serverTimestamp(),

                                closedBy:
                                    auth.currentUser.email

                            }
                        );


                    } catch (error) {

                        console.error(
                            "Close poll error:",
                            error
                        );


                        alert(
                            "Unable to close poll:\n\n" +
                            error.message
                        );


                        button.disabled =
                            false;

                    }

                }
            );

        }
    );


    /*
     * DELETE
     */

    const deleteButtons =
        adminPolls.querySelectorAll(
            ".delete-poll"
        );


    deleteButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    const pollId =
                        button.dataset.id;


                    if (!pollId) {
                        return;
                    }


                    const confirmed =
                        confirm(
                            "Delete this poll permanently?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    try {

                        button.disabled =
                            true;


                        await deleteDoc(
                            doc(
                                db,
                                "polls",
                                pollId
                            )
                        );


                    } catch (error) {

                        console.error(
                            "Delete poll error:",
                            error
                        );


                        alert(
                            "Unable to delete poll:\n\n" +
                            error.message
                        );


                        button.disabled =
                            false;

                    }

                }
            );

        }
    );

}


/* =====================================================
   AUTH ERROR MESSAGE
===================================================== */

function getAuthErrorMessage(
    error
) {

    if (!error) {

        return "Google login failed.";

    }


    switch (
        error.code
    ) {

        case "auth/popup-closed-by-user":

            return "Google login was cancelled.";

        case "auth/popup-blocked":

            return "Google popup was blocked. Allow popups and try again.";

        case "auth/unauthorized-domain":

            return "This website domain is not authorized in Firebase Authentication.";

        case "auth/network-request-failed":

            return "Network error. Check your internet connection.";

        case "auth/operation-not-allowed":

            return "Google Sign-In is not enabled in Firebase.";

        default:

            return (
                "Google login failed: " +
                (
                    error.message ||
                    error.code ||
                    "Unknown error"
                )
            );

    }

}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
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