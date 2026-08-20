/* =====================================================
   SKYLARK POLL ADMIN
   FIREBASE GOOGLE LOGIN
===================================================== */

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

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const provider = new GoogleAuthProvider();


/* =====================================================
   AUTHORIZED ADMINS
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

const createPollButton =
    document.getElementById("createPoll");

const pollQuestion =
    document.getElementById("pollQuestion");

const pollOptions =
    document.getElementById("pollOptions");

const adminPolls =
    document.getElementById("adminPolls");


/* =====================================================
   CHECK ADMIN
===================================================== */

function isAdmin(email) {

    return ADMIN_EMAILS.includes(
        email.toLowerCase()
    );

}


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

    loadPolls();

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

                googleLogin.textContent =
                    "Redirecting to Google...";

                if (loginMessage) {
                    loginMessage.textContent =
                        "Opening Google sign-in...";
                }

                await signInWithRedirect(
                    auth,
                    provider
                );

            } catch (error) {

                console.error(
                    "GOOGLE LOGIN ERROR:",
                    error
                );

                if (loginMessage) {

                    loginMessage.textContent =
                        error.code +
                        ": " +
                        error.message;

                }

                googleLogin.disabled = false;

                googleLogin.textContent =
                    "Continue with Google";

            }

        }
    );

}


/* =====================================================
   HANDLE REDIRECT RESULT
===================================================== */

getRedirectResult(auth)

    .then((result) => {

        if (!result) {
            return;
        }

        const user = result.user;

        if (!user.email) {
            return;
        }

        if (!isAdmin(user.email)) {

            signOut(auth);

            showLogin();

            if (loginMessage) {

                loginMessage.textContent =
                    "❌ This Google account is not an authorized Skylark admin.";

            }

            return;
        }

        showAdmin(user);

    })

    .catch((error) => {

        console.error(
            "REDIRECT LOGIN ERROR:",
            error
        );

        if (loginMessage) {

            loginMessage.textContent =
                error.code +
                ": " +
                error.message;

        }

    });


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

        if (
            !user.email ||
            !isAdmin(user.email)
        ) {

            signOut(auth);

            showLogin();

            if (loginMessage) {

                loginMessage.textContent =
                    "❌ Unauthorized account.";

            }

            return;

        }

        showAdmin(user);

    }
);


/* =====================================================
   LOGOUT
===================================================== */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                showLogin();

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
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

            const question =
                pollQuestion.value.trim();

            const optionsText =
                pollOptions.value.trim();

            if (!question) {

                alert(
                    "Enter a poll question."
                );

                return;

            }

            const optionLines =
                optionsText
                    .split("\n")
                    .map(
                        option =>
                            option.trim()
                    )
                    .filter(
                        option =>
                            option.length > 0
                    );

            if (optionLines.length < 2) {

                alert(
                    "You need at least 2 options."
                );

                return;

            }

            const options =
                optionLines.map(
                    option => ({
                        text: option,
                        votes: 0
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
                        question: question,
                        options: options,
                        active: true,
                        createdAt:
                            serverTimestamp(),
                        createdBy:
                            auth.currentUser.email
                    }
                );

                pollQuestion.value = "";

                pollOptions.value = "";

                alert(
                    "✅ Poll created!"
                );

            } catch (error) {

                console.error(
                    "CREATE POLL ERROR:",
                    error
                );

                alert(
                    error.code +
                    ": " +
                    error.message
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

    const pollsRef =
        collection(
            db,
            "polls"
        );

    onSnapshot(
        pollsRef,
        (snapshot) => {

            adminPolls.innerHTML = "";

            if (snapshot.empty) {

                adminPolls.innerHTML = `
                    <div class="empty-polls">
                        <h3>No Polls</h3>
                        <p>Create your first Skylark poll.</p>
                    </div>
                `;

                return;

            }

            snapshot.forEach(
                pollDoc => {

                    displayPoll(
                        pollDoc.id,
                        pollDoc.data()
                    );

                }
            );

        },
        (error) => {

            console.error(
                "LOAD POLLS ERROR:",
                error
            );

            adminPolls.innerHTML = `
                <div class="empty-polls">
                    <h3>⚠️ Failed to load polls</h3>
                    <p>${escapeHTML(error.message)}</p>
                </div>
            `;

        }
    );

}


/* =====================================================
   DISPLAY POLL
===================================================== */

function displayPoll(
    id,
    poll
) {

    const options =
        Array.isArray(poll.options)
            ? poll.options
            : [];

    const totalVotes =
        options.reduce(
            (total, option) =>
                total +
                Number(option.votes || 0),
            0
        );

    const card =
        document.createElement("div");

    card.className =
        "admin-poll-card";

    let optionsHTML = "";

    options.forEach(
        option => {

            optionsHTML += `
                <div class="admin-option">

                    <span>
                        ${escapeHTML(option.text)}
                    </span>

                    <strong>
                        ${Number(option.votes || 0)}
                    </strong>

                </div>
            `;

        }
    );

    card.innerHTML = `

        <div class="admin-poll-header">

            <div>

                <span class="poll-status">
                    ${poll.active ? "ACTIVE" : "CLOSED"}
                </span>

                <h3>
                    ${escapeHTML(poll.question)}
                </h3>

            </div>

            <button
                class="delete-poll"
                data-id="${id}"
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

    adminPolls.appendChild(card);

    const deleteButton =
        card.querySelector(
            ".delete-poll"
        );

    deleteButton.addEventListener(
        "click",
        () => deletePoll(id)
    );

}


/* =====================================================
   DELETE POLL
===================================================== */

async function deletePoll(
    pollId
) {

    if (
        !confirm(
            "Delete this poll?\n\nThis cannot be undone."
        )
    ) {
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
            "DELETE POLL ERROR:",
            error
        );

        alert(
            error.code +
            ": " +
            error.message
        );

    }

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
