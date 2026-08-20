/* =====================================================
   SKYLARK POLL ADMIN
   FIREBASE + GOOGLE AUTHENTICATION
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
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyAnkbOkah3Jb0a9j3R1GkQ3H8JY5L4",
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
   POLL ADMINS
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

const googleLoginButton =
    document.getElementById("googleLoginButton");

const logoutButton =
    document.getElementById("logoutButton");

const loginMessage =
    document.getElementById("loginMessage");

const adminName =
    document.getElementById("adminName");

const adminEmail =
    document.getElementById("adminEmail");

const createPollForm =
    document.getElementById("createPollForm");

const pollQuestion =
    document.getElementById("pollQuestion");

const optionsContainer =
    document.getElementById("optionsContainer");

const addOptionButton =
    document.getElementById("addOptionButton");

const formMessage =
    document.getElementById("formMessage");

const currentPoll =
    document.getElementById("currentPoll");

const pollHistory =
    document.getElementById("pollHistory");

const deleteModal =
    document.getElementById("deleteModal");

const cancelDelete =
    document.getElementById("cancelDelete");

const confirmDelete =
    document.getElementById("confirmDelete");


let pollToDelete = null;


/* =====================================================
   GOOGLE LOGIN
===================================================== */

googleLoginButton.addEventListener(
    "click",
    async () => {

        loginMessage.textContent = "";

        try {

            await signInWithPopup(
                auth,
                provider
            );

        } catch (error) {

            console.error(error);

            loginMessage.textContent =
                "Google login failed.";

        }

    }
);


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            showLogin();

            return;

        }


        const email =
            (user.email || "").toLowerCase();


        if (!ADMIN_EMAILS.includes(email)) {

            loginMessage.textContent =
                "This Google account is not authorized.";

            await signOut(auth);

            showLogin();

            return;

        }


        adminName.textContent =
            user.displayName || "Skylark Admin";

        adminEmail.textContent =
            user.email;


        showAdmin();

        loadPolls();

    }
);


/* =====================================================
   SHOW LOGIN
===================================================== */

function showLogin() {

    loginScreen.style.display = "flex";

    adminPanel.style.display = "none";

}


/* =====================================================
   SHOW ADMIN
===================================================== */

function showAdmin() {

    loginScreen.style.display = "none";

    adminPanel.style.display = "block";

}


/* =====================================================
   LOGOUT
===================================================== */

logoutButton.addEventListener(
    "click",
    async () => {

        await signOut(auth);

    }
);


/* =====================================================
   ADD OPTION
===================================================== */

addOptionButton.addEventListener(
    "click",
    () => {

        const count =
            optionsContainer.querySelectorAll(
                "input"
            ).length;


        if (count >= 10) {

            formMessage.textContent =
                "Maximum of 10 options.";

            return;

        }


        const wrapper =
            document.createElement("div");

        wrapper.className =
            "option-input";


        const input =
            document.createElement("input");

        input.type = "text";

        input.placeholder =
            `Option ${count + 1}`;


        wrapper.appendChild(input);

        optionsContainer.appendChild(
            wrapper
        );

    }
);


/* =====================================================
   CREATE POLL
===================================================== */

createPollForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        formMessage.textContent =
            "Creating poll...";


        const question =
            pollQuestion.value.trim();


        const inputs =
            optionsContainer.querySelectorAll(
                "input"
            );


        const options = [];


        inputs.forEach(
            (input) => {

                const text =
                    input.value.trim();


                if (text) {

                    options.push({

                        text: text,

                        votes: 0

                    });

                }

            }
        );


        if (!question) {

            formMessage.textContent =
                "Enter a poll question.";

            return;

        }


        if (options.length < 2) {

            formMessage.textContent =
                "Add at least 2 options.";

            return;

        }


        try {

            /*
             * Only one active poll at a time.
             */

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "polls"
                    )
                );


            for (
                const pollDoc of snapshot.docs
            ) {

                const data =
                    pollDoc.data();


                if (data.active === true) {

                    await updateDoc(
                        doc(
                            db,
                            "polls",
                            pollDoc.id
                        ),
                        {
                            active: false
                        }
                    );

                }

            }


            /*
             * Create poll.
             */

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


            formMessage.textContent =
                "Poll created successfully!";


            createPollForm.reset();

            resetOptions();


        } catch (error) {

            console.error(error);

            formMessage.textContent =
                "Failed to create poll.";

        }

    }
);


/* =====================================================
   RESET OPTIONS
===================================================== */

function resetOptions() {

    optionsContainer.innerHTML = "";


    for (
        let i = 1;
        i <= 2;
        i++
    ) {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "option-input";


        const input =
            document.createElement("input");

        input.type = "text";

        input.placeholder =
            `Option ${i}`;

        input.required = true;


        wrapper.appendChild(input);

        optionsContainer.appendChild(
            wrapper
        );

    }

}


/* =====================================================
   LOAD POLLS
===================================================== */

function loadPolls() {

    const pollsQuery =
        query(
            collection(
                db,
                "polls"
            ),
            orderBy(
                "createdAt",
                "desc"
            )
        );


    onSnapshot(
        pollsQuery,
        (snapshot) => {

            const polls = [];


            snapshot.forEach(
                (pollDoc) => {

                    polls.push({

                        id: pollDoc.id,

                        ...pollDoc.data()

                    });

                }
            );


            renderPolls(polls);

        },
        (error) => {

            console.error(
                "Firebase poll error:",
                error
            );

        }
    );

}


/* =====================================================
   RENDER POLLS
===================================================== */

function renderPolls(polls) {

    const active =
        polls.find(
            poll =>
                poll.active === true
        );


    const history =
        polls.filter(
            poll =>
                poll.active !== true
        );


    renderCurrentPoll(active);

    renderHistory(history);

}


/* =====================================================
   CURRENT POLL
===================================================== */

function renderCurrentPoll(poll) {

    if (!poll) {

        currentPoll.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🗳️
                </div>

                <h3>
                    No Active Poll
                </h3>

                <p>
                    Create a poll to see it here.
                </p>

            </div>

        `;

        return;

    }


    const totalVotes =
        poll.options.reduce(
            (total, option) =>
                total + (option.votes || 0),
            0
        );


    let optionsHTML = "";


    poll.options.forEach(
        (option) => {

            const votes =
                option.votes || 0;


            const percentage =
                totalVotes === 0
                    ? 0
                    : Math.round(
                        (votes / totalVotes) * 100
                    );


            optionsHTML += `

                <div class="admin-option">

                    <div class="admin-option-top">

                        <span>
                            ${escapeHTML(option.text)}
                        </span>

                        <strong>
                            ${votes}
                            (${percentage}%)
                        </strong>

                    </div>

                    <div class="admin-progress">

                        <div
                            class="admin-progress-bar"
                            style="width:${percentage}%"
                        ></div>

                    </div>

                </div>

            `;

        }
    );


    currentPoll.innerHTML = `

        <div class="poll-box">

            <div class="poll-box-header">

                <h3>
                    ${escapeHTML(poll.question)}
                </h3>

                <span class="active-badge">
                    ACTIVE
                </span>

            </div>

            ${optionsHTML}

            <div class="poll-actions">

                <button
                    class="close-poll-button"
                    onclick="closePoll('${poll.id}')"
                >
                    Close Poll
                </button>

                <button
                    class="delete-poll-button"
                    onclick="openDeleteModal('${poll.id}')"
                >
                    Delete Poll
                </button>

            </div>

        </div>

    `;

}


/* =====================================================
   HISTORY
===================================================== */

function renderHistory(polls) {

    if (polls.length === 0) {

        pollHistory.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📊
                </div>

                <h3>
                    No Previous Polls
                </h3>

                <p>
                    Closed polls will appear here.
                </p>

            </div>

        `;

        return;

    }


    let html = "";


    polls.forEach(
        (poll) => {

            const totalVotes =
                poll.options.reduce(
                    (total, option) =>
                        total + (option.votes || 0),
                    0
                );


            html += `

                <div class="history-item">

                    <div class="history-question">
                        ${escapeHTML(
                            poll.question
                        )}
                    </div>

                    <div class="history-meta">
                        ${totalVotes} total votes
                    </div>

                    <div class="poll-actions">

                        <button
                            class="delete-poll-button"
                            onclick="openDeleteModal('${poll.id}')"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `;

        }
    );


    pollHistory.innerHTML = html;

}


/* =====================================================
   CLOSE POLL
===================================================== */

window.closePoll =
    async function (pollId) {

        try {

            await updateDoc(
                doc(
                    db,
                    "polls",
                    pollId
                ),
                {
                    active: false
                }
            );

        } catch (error) {

            console.error(error);

            alert(
                "Failed to close poll."
            );

        }

    };


/* =====================================================
   DELETE MODAL
===================================================== */

window.openDeleteModal =
    function (pollId) {

        pollToDelete =
            pollId;

        deleteModal.classList.add(
            "show"
        );

    };


cancelDelete.addEventListener(
    "click",
    () => {

        pollToDelete = null;

        deleteModal.classList.remove(
            "show"
        );

    }
);


/* =====================================================
   DELETE POLL
===================================================== */

confirmDelete.addEventListener(
    "click",
    async () => {

        if (!pollToDelete) {
            return;
        }


        try {

            await deleteDoc(
                doc(
                    db,
                    "polls",
                    pollToDelete
                )
            );


            pollToDelete = null;

            deleteModal.classList.remove(
                "show"
            );


        } catch (error) {

            console.error(error);

            alert(
                "Failed to delete poll."
            );

        }

    }
);


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(value)

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