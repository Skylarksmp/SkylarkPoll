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
   FIREBASE
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyAnkbOkah3JjBe_9lsYYMinMXzY5VlLfL4",
    authDomain: "skylark-staff-application.firebaseapp.com",
    projectId: "skylark-staff-application",
    storageBucket: "skylark-staff-application.firebasestorage.app",
    messagingSenderId: "877610328379",
    appId: "1:877610328379:web:8d0a892bad042875de971e"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const provider = new GoogleAuthProvider();

provider.setCustomParameters({
    prompt: "select_account"
});


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

const createPoll =
    document.getElementById("createPoll");

const pollQuestion =
    document.getElementById("pollQuestion");

const pollOptions =
    document.getElementById("pollOptions");

const adminPolls =
    document.getElementById("adminPolls");


/* =====================================================
   MESSAGE
===================================================== */

function message(text) {

    console.log(
        "SKYLARK:",
        text
    );

    if (loginMessage) {
        loginMessage.textContent = text;
    }

}


/* =====================================================
   ADMIN CHECK
===================================================== */

function checkAdmin(email) {

    if (!email) {
        return false;
    }

    return ADMIN_EMAILS.includes(
        email.toLowerCase().trim()
    );

}


/* =====================================================
   SHOW LOGIN
===================================================== */

function showLogin() {

    loginScreen.style.display =
        "flex";

    adminPanel.style.display =
        "none";

}


/* =====================================================
   SHOW ADMIN
===================================================== */

function showAdmin(user) {

    console.log(
        "ADMIN LOGIN:",
        user.email
    );


    if (!checkAdmin(user.email)) {

        message(
            "❌ Unauthorized account: " +
            user.email
        );

        showLogin();

        return;

    }


    loginScreen.style.display =
        "none";

    adminPanel.style.display =
        "block";


    adminEmail.textContent =
        user.email;


    message(
        "✅ Admin authenticated."
    );


    loadPolls();

}


/* =====================================================
   GOOGLE LOGIN
===================================================== */

googleLogin.addEventListener(
    "click",
    async () => {

        console.log(
            "LOGIN BUTTON CLICKED"
        );


        googleLogin.disabled =
            true;

        googleLogin.textContent =
            "Opening Google...";


        message(
            "🔄 Opening Google..."
        );


        try {

            await signInWithRedirect(
                auth,
                provider
            );

        } catch (error) {

            console.error(
                error
            );


            message(
                "❌ " +
                error.code +
                ": " +
                error.message
            );


            googleLogin.disabled =
                false;

            googleLogin.textContent =
                "Continue with Google";

        }

    }
);


/* =====================================================
   REDIRECT RESULT
===================================================== */

getRedirectResult(auth)

    .then(
        (result) => {

            if (!result) {

                console.log(
                    "No redirect result."
                );

                return;

            }


            console.log(
                "REDIRECT SUCCESS"
            );


            if (result.user) {

                showAdmin(
                    result.user
                );

            }

        }
    )

    .catch(
        (error) => {

            console.error(
                "REDIRECT ERROR:",
                error
            );


            message(
                "❌ " +
                error.code +
                ": " +
                error.message
            );

        }
    );


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    (user) => {

        console.log(
            "AUTH STATE:",
            user
                ? user.email
                : "logged out"
        );


        if (!user) {

            showLogin();

            return;

        }


        showAdmin(user);

    }
);


/* =====================================================
   LOGOUT
===================================================== */

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            showLogin();

            message(
                "Logged out."
            );

        } catch (error) {

            message(
                "❌ " +
                error.code +
                ": " +
                error.message
            );

        }

    }
);


/* =====================================================
   CREATE POLL
===================================================== */

createPoll.addEventListener(
    "click",
    async () => {

        const question =
            pollQuestion.value.trim();

        const optionText =
            pollOptions.value.trim();


        if (!question) {

            alert(
                "Enter a poll question."
            );

            return;

        }


        const lines =
            optionText
                .split("\n")
                .map(
                    x => x.trim()
                )
                .filter(
                    x => x.length > 0
                );


        if (lines.length < 2) {

            alert(
                "Enter at least 2 options."
            );

            return;

        }


        const options =
            lines.map(
                text => ({

                    text: text,

                    votes: 0

                })
            );


        try {

            createPoll.disabled =
                true;

            createPoll.textContent =
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
                "✅ Poll created!"
            );


        } catch (error) {

            alert(
                "❌ " +
                error.code +
                "\n" +
                error.message
            );

        } finally {

            createPoll.disabled =
                false;

            createPoll.textContent =
                "Create Poll";

        }

    }
);


/* =====================================================
   LOAD POLLS
===================================================== */

function loadPolls() {

    onSnapshot(
        collection(
            db,
            "polls"
        ),

        (snapshot) => {

            adminPolls.innerHTML =
                "";


            if (snapshot.empty) {

                adminPolls.innerHTML = `
                    <div class="empty-polls">
                        <h3>No Polls Yet</h3>
                        <p>Create your first Skylark poll.</p>
                    </div>
                `;

                return;

            }


            snapshot.forEach(
                poll => {

                    renderPoll(
                        poll.id,
                        poll.data()
                    );

                }
            );

        },

        (error) => {

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
        poll.options || [];


    const totalVotes =
        options.reduce(
            (total, option) =>
                total +
                Number(
                    option.votes || 0
                ),
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


    card
        .querySelector(
            ".delete-poll"
        )
        .addEventListener(
            "click",
            () => deletePoll(id)
        );

}


/* =====================================================
   DELETE POLL
===================================================== */

async function deletePoll(id) {

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
                id
            )
        );


        alert(
            "✅ Poll deleted."
        );

    } catch (error) {

        alert(
            "❌ " +
            error.code +
            "\n" +
            error.message
        );

    }

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(text) {

    return String(text)

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
