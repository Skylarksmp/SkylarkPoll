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
    signInWithPopup,
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
   FIREBASE INITIALIZE
===================================================== */

const app =
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(
        app
    );


const db =
    getFirestore(
        app
    );


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


const loginButton =
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


const questionInput =
    document.getElementById(
        "pollQuestion"
    );


const optionsInput =
    document.getElementById(
        "pollOptions"
    );


const pollsContainer =
    document.getElementById(
        "adminPolls"
    );


/* =====================================================
   CHECK ADMIN
===================================================== */

function isAdmin(
    email
) {

    return ADMIN_EMAILS
        .map(
            value =>
                value.toLowerCase()
        )
        .includes(
            email.toLowerCase()
        );

}


/* =====================================================
   GOOGLE LOGIN
===================================================== */

if (loginButton) {

    loginButton.addEventListener(
        "click",

        async () => {

            loginMessage.textContent =
                "Signing in with Google...";


            try {

                const result =
                    await signInWithPopup(
                        auth,
                        provider
                    );


                const user =
                    result.user;


                if (
                    !user.email ||
                    !isAdmin(
                        user.email
                    )
                ) {

                    await signOut(
                        auth
                    );


                    loginMessage.textContent =
                        "❌ This Google account is not an authorized Skylark admin.";

                    return;

                }


                loginMessage.textContent =
                    "✅ Admin login successful.";

            }

            catch (error) {

                console.error(
                    "GOOGLE LOGIN ERROR:",
                    error
                );


                loginMessage.textContent =
                    error.code +
                    ": " +
                    error.message;

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


        if (
            !user.email ||
            !isAdmin(
                user.email
            )
        ) {

            signOut(
                auth
            );

            showLogin();

            loginMessage.textContent =
                "❌ Unauthorized admin account.";

            return;

        }


        showAdminPanel(
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

}


/* =====================================================
   SHOW ADMIN PANEL
===================================================== */

function showAdminPanel(
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


    loadPolls();

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

            }

            catch (error) {

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
                questionInput
                    ?.value
                    .trim();


            const optionsText =
                optionsInput
                    ?.value
                    .trim();


            if (!question) {

                alert(
                    "Please enter a poll question."
                );

                return;

            }


            if (!optionsText) {

                alert(
                    "Please enter at least two options."
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


            if (
                optionLines.length < 2
            ) {

                alert(
                    "A poll needs at least two options."
                );

                return;

            }


            const options =
                optionLines.map(
                    text => ({

                        text: text,

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


                questionInput.value =
                    "";

                optionsInput.value =
                    "";


                alert(
                    "✅ Poll created successfully!"
                );


            }

            catch (error) {

                console.error(
                    "CREATE POLL ERROR:",
                    error
                );


                alert(
                    error.code +
                    ": " +
                    error.message
                );

            }

            finally {

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

    if (!pollsContainer) {
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

            pollsContainer.innerHTML =
                "";


            if (
                snapshot.empty
            ) {

                pollsContainer.innerHTML = `

                    <div class="empty-polls">

                        <h3>
                            No Polls
                        </h3>

                        <p>
                            Create your first Skylark poll.
                        </p>

                    </div>

                `;

                return;

            }


            snapshot.forEach(
                (pollDoc) => {

                    const poll =
                        pollDoc.data();


                    displayPoll(
                        pollDoc.id,
                        poll
                    );

                }
            );

        },

        (error) => {

            console.error(
                "LOAD POLLS ERROR:",
                error
            );


            pollsContainer.innerHTML = `

                <div class="empty-polls">

                    <h3>
                        ⚠️ Failed to load polls
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
   DISPLAY ADMIN POLL
===================================================== */

function displayPoll(
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
        (option) => {

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

                    ${
                        poll.active
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


    pollsContainer.appendChild(
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

    }

    catch (error) {

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

function escapeHTML(
    value
) {

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