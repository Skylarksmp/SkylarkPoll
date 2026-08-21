/* =====================================================
   SKYLARK NETWORK
   ADMIN PANEL
   COMPLETE ADMIN.JS
   CLOSE = PERMANENTLY DELETE POLL
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
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
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
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getFirestore(app);


const provider =
    new GoogleAuthProvider();


/* =====================================================
   ADMIN EMAIL
===================================================== */

const ADMIN_EMAIL =
    "xianytcontent@gmail.com";


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
   FIREBASE READY
===================================================== */

if (loginMessage) {

    loginMessage.textContent =
        "Firebase loaded — ready to login.";

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

                if (loginMessage) {

                    loginMessage.textContent =
                        "Opening Google login...";

                }


                const result =
                    await signInWithPopup(
                        auth,
                        provider
                    );


                const user =
                    result.user;


                if (
                    user.email
                    .toLowerCase()
                    !==
                    ADMIN_EMAIL.toLowerCase()
                ) {

                    await signOut(auth);


                    throw new Error(
                        "This Google account is not authorized."
                    );

                }


                if (loginMessage) {

                    loginMessage.textContent =
                        "Login successful.";

                }

            } catch (error) {

                console.error(
                    "Google login error:",
                    error
                );


                if (loginMessage) {

                    loginMessage.textContent =
                        error.message ||
                        "Google login failed.";

                }

            } finally {

                googleLogin.disabled =
                    false;

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
            user.email.toLowerCase()
            !==
            ADMIN_EMAIL.toLowerCase()
        ) {

            signOut(auth);

            showLogin();

            if (loginMessage) {

                loginMessage.textContent =
                    "This account is not authorized.";

            }

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
            "Not signed in";

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
            "SIGNED IN AS " +
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
   CREATE POLL
===================================================== */

if (createPoll) {

    createPoll.addEventListener(
        "click",
        async () => {

            const question =
                pollQuestion
                    ?.value
                    .trim();


            const optionsText =
                pollOptions
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
                    "Please enter the voting options."
                );

                return;

            }


            const options =
                optionsText
                    .split("\n")
                    .map(
                        option =>
                            option.trim()
                    )
                    .filter(
                        option =>
                            option.length > 0
                    )
                    .map(
                        option => ({

                            text: option,

                            votes: 0

                        })
                    );


            if (options.length < 2) {

                alert(
                    "A poll needs at least 2 options."
                );

                return;

            }


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
                            auth.currentUser
                                ?.email ||
                            ADMIN_EMAIL

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
                    "Failed to create poll.\n\n" +
                    error.message
                );

            } finally {

                createPoll.disabled =
                    false;

                createPoll.textContent =
                    "Create Poll →";

            }

        }
    );

}


/* =====================================================
   LOAD POLLS
===================================================== */

let unsubscribePolls =
    null;


function loadPolls() {

    if (!adminPolls) {

        return;

    }


    if (unsubscribePolls) {

        unsubscribePolls();

    }


    adminPolls.innerHTML = `

        <div class="loading">
            Loading polls...
        </div>

    `;


    const pollsRef =
        collection(
            db,
            "polls"
        );


    unsubscribePolls =
        onSnapshot(
            pollsRef,
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
                    (a, b) => {

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
                    No Polls Yet
                </h3>

                <p>
                    Create your first Skylark community poll above.
                </p>

            </div>

        `;

        return;

    }


    adminPolls.innerHTML =
        polls
            .map(
                poll =>
                    createPollCard(
                        poll
                    )
            )
            .join("");


    attachPollActions();

}


/* =====================================================
   CREATE POLL CARD
===================================================== */

function createPollCard(
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
            ) =>
                total +
                Number(
                    option.votes ||
                    0
                ),
            0
        );


    const active =
        poll.active === true;


    const optionsHTML =
        options
            .map(
                option => `

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
            )
            .join("");


    return `

        <div
            class="admin-poll-card"
            data-poll-id="${escapeHTML(
                poll.id
            )}"
        >

            <div class="admin-poll-header">

                <div>

                    <span class="poll-status">

                        ${
                            active
                                ? "LIVE"
                                : "CLOSED"
                        }

                    </span>


                    <h3>

                        ${escapeHTML(
                            poll.question ||
                            "Untitled Poll"
                        )}

                    </h3>

                </div>


                ${
                    active
                        ? `

                            <div class="poll-actions">

                                <button
                                    class="close-poll"
                                    data-poll-id="${escapeHTML(
                                        poll.id
                                    )}"
                                    type="button"
                                >

                                    🔒 Close

                                </button>

                            </div>

                        `
                        : ""
                }

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


/* =====================================================
   ATTACH POLL ACTIONS
===================================================== */

function attachPollActions() {

    const closeButtons =
        document.querySelectorAll(
            ".close-poll"
        );


    closeButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    const pollId =
                        button.dataset.pollId;


                    if (!pollId) {

                        return;

                    }


                    await deletePoll(
                        pollId,
                        button
                    );

                }
            );

        }
    );

}


/* =====================================================
   DELETE POLL
   CLOSE BUTTON = DELETE
===================================================== */

async function deletePoll(
    pollId,
    button
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this poll?\n\n" +
            "This will permanently remove the poll " +
            "and all of its vote counts.\n\n" +
            "This action cannot be undone."
        );


    if (!confirmed) {

        return;

    }


    try {

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Deleting...";

        }


        const pollRef =
            doc(
                db,
                "polls",
                pollId
            );


        await deleteDoc(
            pollRef
        );


        console.log(
            "Poll permanently deleted:",
            pollId
        );


    } catch (error) {

        console.error(
            "Delete poll error:",
            error
        );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "🔒 Close";

        }


        alert(
            "Failed to delete the poll.\n\n" +
            error.message
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