/* =====================================================
   SKYLARK NETWORK
   ADMIN PANEL
   COMPLETE ADMIN.JS

   CLOSE ACTIVE POLL = DELETE
   CLEAR CLOSED POLLS = DELETE OLD CLOSED POLLS
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
    getDocs,
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
   FIREBASE
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
   ADMIN
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

const clearClosedPolls =
    document.getElementById("clearClosedPolls");


/* =====================================================
   DEBUG
===================================================== */

console.log(
    "Skylark Admin JS loaded."
);

console.log(
    "Clear button:",
    clearClosedPolls
);


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

                loginMessage.textContent =
                    "Opening Google login...";


                const result =
                    await signInWithPopup(
                        auth,
                        provider
                    );


                const user =
                    result.user;


                if (
                    !user.email ||
                    user.email.toLowerCase()
                    !==
                    ADMIN_EMAIL.toLowerCase()
                ) {

                    await signOut(auth);

                    throw new Error(
                        "This Google account is not authorized."
                    );

                }


                loginMessage.textContent =
                    "Login successful.";

            } catch (error) {

                console.error(
                    "Google login error:",
                    error
                );

                loginMessage.textContent =
                    error.message ||
                    "Google login failed.";

            } finally {

                googleLogin.disabled =
                    false;

            }

        }
    );

}


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
    auth,
    user => {

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

            loginMessage.textContent =
                "This account is not authorized.";

            return;

        }


        showAdmin(user);

    }
);


/* =====================================================
   LOGIN SCREEN
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
   ADMIN SCREEN
===================================================== */

function showAdmin(user) {

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
   CREATE POLL
===================================================== */

if (createPoll) {

    createPoll.addEventListener(
        "click",
        async () => {

            const question =
                pollQuestion.value.trim();


            const optionsText =
                pollOptions.value.trim();


            if (!question) {

                alert(
                    "Please enter a poll question."
                );

                return;

            }


            if (!optionsText) {

                alert(
                    "Please enter voting options."
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


                pollQuestion.value =
                    "";

                pollOptions.value =
                    "";


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

let unsubscribePolls = null;


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


    unsubscribePolls =
        onSnapshot(
            collection(
                db,
                "polls"
            ),

            snapshot => {

                const polls = [];


                snapshot.forEach(
                    pollDoc => {

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
                            a.createdAt?.seconds ||
                            0;

                        const bTime =
                            b.createdAt?.seconds ||
                            0;

                        return bTime - aTime;

                    }
                );


                renderPolls(
                    polls
                );

            },

            error => {

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
   RENDER POLLS
===================================================== */

function renderPolls(
    polls
) {

    if (polls.length === 0) {

        adminPolls.innerHTML = `

            <div class="empty-polls">

                <h3>
                    No Polls Yet
                </h3>

                <p>
                    Create your first Skylark community poll.
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


    attachCloseButtons();

}


/* =====================================================
   POLL CARD
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
                    option.votes || 0
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
                                option.votes || 0
                            )}
                        </strong>

                    </div>

                `
            )
            .join("");


    return `

        <div class="admin-poll-card">

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

                            <button
                                class="close-poll"
                                data-poll-id="${escapeHTML(
                                    poll.id
                                )}"
                                type="button"
                            >
                                🔒 Close
                            </button>

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
   CLOSE ACTIVE POLL
   CLOSE = DELETE
===================================================== */

function attachCloseButtons() {

    document
        .querySelectorAll(
            ".close-poll"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const pollId =
                            button.dataset.pollId;


                        if (!pollId) {

                            alert(
                                "Poll ID missing."
                            );

                            return;

                        }


                        const confirmed =
                            confirm(
                                "Delete this poll permanently?\n\n" +
                                "All vote counts will be removed.\n\n" +
                                "This cannot be undone."
                            );


                        if (!confirmed) {

                            return;

                        }


                        try {

                            button.disabled =
                                true;

                            button.textContent =
                                "Deleting...";


                            await deleteDoc(
                                doc(
                                    db,
                                    "polls",
                                    pollId
                                )
                            );


                            console.log(
                                "Deleted poll:",
                                pollId
                            );


                        } catch (error) {

                            console.error(
                                "Delete error:",
                                error
                            );


                            button.disabled =
                                false;

                            button.textContent =
                                "🔒 Close";


                            alert(
                                "Failed to delete poll.\n\n" +
                                error.message
                            );

                        }

                    }
                );

            }
        );

}


/* =====================================================
   CLEAR ALL CLOSED POLLS
===================================================== */

if (clearClosedPolls) {

    clearClosedPolls.addEventListener(
        "click",
        clearClosedPollsNow
    );

}


/* =====================================================
   CLEAR CLOSED POLLS FUNCTION
===================================================== */

async function clearClosedPollsNow() {

    console.log(
        "Clear All Closed Polls clicked."
    );


    const confirmed =
        confirm(
            "⚠️ DELETE ALL CLOSED POLLS?\n\n" +
            "Every poll with active = false " +
            "will be permanently deleted.\n\n" +
            "ACTIVE polls will NOT be deleted.\n\n" +
            "This cannot be undone."
        );


    if (!confirmed) {

        return;

    }


    try {

        clearClosedPolls.disabled =
            true;

        clearClosedPolls.textContent =
            "🔄 Checking closed polls...";


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "polls"
                )
            );


        const closedPollIds = [];


        snapshot.forEach(
            pollDoc => {

                const data =
                    pollDoc.data();


                console.log(
                    "Checking poll:",
                    pollDoc.id,
                    data.active
                );


                if (
                    data.active === false
                ) {

                    closedPollIds.push(
                        pollDoc.id
                    );

                }

            }
        );


        console.log(
            "Closed polls found:",
            closedPollIds.length
        );


        if (
            closedPollIds.length === 0
        ) {

            alert(
                "No closed polls were found."
            );

            return;

        }


        clearClosedPolls.textContent =
            `🗑️ Deleting ${closedPollIds.length}...`;


        for (
            const pollId
            of closedPollIds
        ) {

            await deleteDoc(
                doc(
                    db,
                    "polls",
                    pollId
                )
            );

        }


        alert(
            `Successfully deleted ${closedPollIds.length} closed poll(s)!`
        );


    } catch (error) {

        console.error(
            "Clear closed polls error:",
            error
        );


        alert(
            "Failed to clear closed polls.\n\n" +
            error.message
        );

    } finally {

        clearClosedPolls.disabled =
            false;

        clearClosedPolls.textContent =
            "🗑️ Clear All Closed Polls";

    }

}


/* =====================================================
   ESCAPE HTML
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