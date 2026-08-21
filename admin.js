/* =====================================================
   SKYLARK NETWORK
   ADMIN PANEL
   ADMIN.JS
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
    apiKey: "AIzaSyAnkbOkah3JjBe_9lsYYMinMXzY5VlLfL4",
    authDomain: "skylark-staff-application.firebaseapp.com",
    projectId: "skylark-staff-application",
    storageBucket: "skylark-staff-application.firebasestorage.app",
    messagingSenderId: "877610328379",
    appId: "1:877610328379:web:8d0a892bad042875de971e"
};


/* =====================================================
   INITIALIZE
===================================================== */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const provider = new GoogleAuthProvider();


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
    document.getElementById("loginScreen");

const adminPanel =
    document.getElementById("adminPanel");

const googleLogin =
    document.getElementById("googleLogin");

const logoutButton =
    document.getElementById("logoutButton");

const loginMessage =
    document.getElementById("loginMessage");

const adminEmail =
    document.getElementById("adminEmail");

const createPoll =
    document.getElementById("createPoll");

const pollQuestion =
    document.getElementById("pollQuestion");

const pollOptions =
    document.getElementById("pollOptions");

const adminPolls =
    document.getElementById("adminPolls");


/* =====================================================
   POLL LISTENER
===================================================== */

let unsubscribePolls = null;


/* =====================================================
   VOTE LISTENER
===================================================== */

let unsubscribeVotes = null;


/* =====================================================
   LOGIN MESSAGE
===================================================== */

function showLoginMessage(message) {

    if (!loginMessage) {
        return;
    }

    loginMessage.textContent = message;
}


/* =====================================================
   ADMIN CHECK
===================================================== */

function isAdmin(user) {

    if (!user || !user.email) {
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

                googleLogin.disabled = true;

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
                    getAuthErrorMessage(error)
                );

                googleLogin.disabled = false;
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

                await signOut(auth);

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

            stopListeners();

            showLogin();

            return;
        }


        if (!isAdmin(user)) {

            showLoginMessage(
                "This Google account is not authorized."
            );

            signOut(auth);

            return;
        }


        showAdmin(user);
    }
);


/* =====================================================
   SHOW LOGIN
===================================================== */

function showLogin() {

    if (loginScreen) {
        loginScreen.style.display = "flex";
    }

    if (adminPanel) {
        adminPanel.style.display = "none";
    }

    if (adminEmail) {
        adminEmail.textContent = "";
    }
}


/* =====================================================
   SHOW ADMIN
===================================================== */

function showAdmin(user) {

    if (loginScreen) {
        loginScreen.style.display = "none";
    }

    if (adminPanel) {
        adminPanel.style.display = "block";
    }

    if (adminEmail) {
        adminEmail.textContent = user.email;
    }

    showLoginMessage(
        "Firebase loaded — ready to manage polls."
    );

    startPollListener();

    startVoteListener();
}


/* =====================================================
   STOP LISTENERS
===================================================== */

function stopListeners() {

    if (unsubscribePolls) {

        unsubscribePolls();

        unsubscribePolls = null;
    }

    if (unsubscribeVotes) {

        unsubscribeVotes();

        unsubscribeVotes = null;
    }
}


/* =====================================================
   CREATE POLL
===================================================== */

if (createPoll) {

    createPoll.addEventListener(
        "click",
        async () => {

            const question =
                pollQuestion?.value?.trim();


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
                    "Maximum 10 options."
                );

                return;
            }


            try {

                createPoll.disabled = true;


                /*
                 * Close every currently active poll.
                 */

                await closeActivePolls();


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
                    pollQuestion.value = "";
                }


                if (pollOptions) {
                    pollOptions.value = "";
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

                createPoll.disabled = false;
            }
        }
    );
}


/* =====================================================
   CLOSE ACTIVE POLLS
===================================================== */

async function closeActivePolls() {

    return new Promise(
        (resolve) => {

            const unsubscribe =
                onSnapshot(

                    collection(
                        db,
                        "polls"
                    ),

                    async (snapshot) => {

                        try {

                            const tasks = [];


                            snapshot.forEach(
                                pollDoc => {

                                    const data =
                                        pollDoc.data();


                                    if (
                                        data.active === true
                                    ) {

                                        tasks.push(
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
                                tasks
                            );


                            unsubscribe();

                            resolve();

                        } catch (error) {

                            console.error(
                                "Close active polls error:",
                                error
                            );

                            unsubscribe();

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
   POLL LISTENER
===================================================== */

function startPollListener() {

    if (unsubscribePolls) {
        unsubscribePolls();
    }


    unsubscribePolls =
        onSnapshot(

            collection(
                db,
                "polls"
            ),

            (snapshot) => {

                renderPolls(
                    snapshot
                );

            },

            (error) => {

                console.error(
                    "Poll listener error:",
                    error
                );


                if (adminPolls) {

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

            }
        );
}


/* =====================================================
   VOTE LISTENER
===================================================== */

function startVoteListener() {

    if (unsubscribeVotes) {
        unsubscribeVotes();
    }


    unsubscribeVotes =
        onSnapshot(

            collection(
                db,
                "votes"
            ),

            (snapshot) => {

                const voteCounts = {};


                snapshot.forEach(
                    voteDoc => {

                        const data =
                            voteDoc.data();


                        if (!data.pollId) {
                            return;
                        }


                        if (
                            !voteCounts[data.pollId]
                        ) {

                            voteCounts[data.pollId] = [];

                        }


                        const index =
                            Number(
                                data.optionIndex
                            );


                        voteCounts[data.pollId][index] =
                            (
                                voteCounts[data.pollId][index] ||
                                0
                            ) + 1;

                    }
                );


                updateVoteCounts(
                    voteCounts
                );

            },

            (error) => {

                console.error(
                    "Vote listener error:",
                    error
                );

            }
        );
}


/* =====================================================
   RENDER POLLS
===================================================== */

let currentPolls = [];


function renderPolls(snapshot) {

    currentPolls = [];


    snapshot.forEach(
        pollDoc => {

            currentPolls.push({

                id:
                    pollDoc.id,

                ...pollDoc.data()

            });

        }
    );


    currentPolls.sort(
        (a, b) => {

            const aTime =
                a.createdAt?.seconds || 0;

            const bTime =
                b.createdAt?.seconds || 0;

            return bTime - aTime;
        }
    );


    if (!adminPolls) {
        return;
    }


    if (currentPolls.length === 0) {

        adminPolls.innerHTML = `

            <div class="empty-polls">

                <h3>
                    No polls yet
                </h3>

                <p>
                    Create your first Skylark poll.
                </p>

            </div>

        `;

        return;
    }


    adminPolls.innerHTML =
        currentPolls.map(
            poll => {

                const options =
                    Array.isArray(
                        poll.options
                    )
                        ? poll.options
                        : [];


                return `

                    <div
                        class="admin-poll-card"
                        data-poll-id="${poll.id}"
                    >

                        <div class="admin-poll-header">

                            <div>

                                <span class="poll-status">

                                    ${
                                        poll.active === true
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
                                    poll.active === true
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

                            ${
                                options.map(
                                    (option, index) => `

                                        <div
                                            class="admin-option"
                                            data-option="${index}"
                                        >

                                            <span>
                                                ${escapeHTML(
                                                    option.text
                                                )}
                                            </span>

                                            <strong>
                                                0
                                            </strong>

                                        </div>

                                    `
                                ).join("")
                            }

                        </div>


                        <div class="admin-total">

                            Total votes:

                            <strong>
                                0
                            </strong>

                        </div>

                    </div>

                `;

            }
        ).join("");


    attachButtons();
}


/* =====================================================
   UPDATE VOTE COUNTS
===================================================== */

function updateVoteCounts(
    voteCounts
) {

    if (!adminPolls) {
        return;
    }


    currentPolls.forEach(
        poll => {

            const card =
                adminPolls.querySelector(
                    `[data-poll-id="${poll.id}"]`
                );


            if (!card) {
                return;
            }


            const counts =
                voteCounts[poll.id] || [];


            const optionElements =
                card.querySelectorAll(
                    ".admin-option"
                );


            let total = 0;


            optionElements.forEach(
                (
                    element,
                    index
                ) => {

                    const count =
                        counts[index] || 0;


                    const number =
                        element.querySelector(
                            "strong"
                        );


                    if (number) {

                        number.textContent =
                            count;

                    }


                    total += count;

                }
            );


            const totalElement =
                card.querySelector(
                    ".admin-total strong"
                );


            if (totalElement) {

                totalElement.textContent =
                    total;

            }

        }
    );
}


/* =====================================================
   BUTTONS
===================================================== */

function attachButtons() {

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


                    if (
                        !confirm(
                            "Close this poll?\n\nPlayers will no longer be able to vote."
                        )
                    ) {

                        return;
                    }


                    try {

                        button.disabled = true;


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


                        button.disabled = false;
                    }

                }
            );

        }
    );


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


                    if (
                        !confirm(
                            "Delete this poll permanently?"
                        )
                    ) {

                        return;
                    }


                    try {

                        button.disabled = true;


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


                        button.disabled = false;
                    }

                }
            );

        }
    );
}


/* =====================================================
   AUTH ERROR
===================================================== */

function getAuthErrorMessage(
    error
) {

    if (!error) {
        return "Google login failed.";
    }


    switch (error.code) {

        case "auth/popup-closed-by-user":

            return "Google login was cancelled.";

        case "auth/popup-blocked":

            return "Google popup was blocked.";

        case "auth/unauthorized-domain":

            return "This domain is not authorized in Firebase.";

        case "auth/network-request-failed":

            return "Network error. Check your connection.";

        case "auth/operation-not-allowed":

            return "Google Sign-In is not enabled.";

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
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

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