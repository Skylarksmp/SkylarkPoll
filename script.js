/* =====================================================
   SKYLARK POLL
   PLAYER SCRIPT
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    onSnapshot,
    doc,
    runTransaction
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

const app =
    initializeApp(firebaseConfig);

const db =
    getFirestore(app);


/* =====================================================
   ELEMENTS
===================================================== */

const pollContainer =
    document.getElementById("pollContainer");

const pollMessage =
    document.getElementById("pollMessage");

const totalVotesElement =
    document.getElementById("totalVotes");


/* =====================================================
   LOAD ACTIVE POLL
===================================================== */

const pollsRef =
    collection(
        db,
        "polls"
    );


onSnapshot(
    pollsRef,
    (snapshot) => {

        let activePoll = null;


        snapshot.forEach(
            (pollDoc) => {

                const data =
                    pollDoc.data();


                if (
                    data.active === true
                ) {

                    activePoll = {

                        id: pollDoc.id,

                        ...data

                    };

                }

            }
        );


        if (!activePoll) {

            showNoPoll();

            return;

        }


        renderPoll(activePoll);

    },
    (error) => {

        console.error(
            "Poll loading error:",
            error
        );


        showError();

    }
);


/* =====================================================
   SHOW POLL
===================================================== */

function renderPoll(poll) {

    if (!pollContainer) {
        return;
    }


    const voted =
        hasVoted(poll.id);


    const totalVotes =
        poll.options.reduce(
            (total, option) =>
                total +
                Number(
                    option.votes || 0
                ),
            0
        );


    if (totalVotesElement) {

        totalVotesElement.textContent =
            totalVotes;

    }


    let optionsHTML = "";


    poll.options.forEach(
        (option, index) => {

            const votes =
                Number(
                    option.votes || 0
                );


            const percentage =
                totalVotes === 0
                    ? 0
                    : Math.round(
                        (votes /
                        totalVotes) *
                        100
                    );


            optionsHTML += `

                <button
                    class="poll-option"
                    data-option-index="${index}"
                    ${voted ? "disabled" : ""}
                >

                    <div class="option-top">

                        <span class="option-name">

                            ${escapeHTML(
                                option.text
                            )}

                        </span>

                        <span class="option-votes">

                            ${votes}
                            votes

                        </span>

                    </div>


                    <div class="option-bar">

                        <div
                            class="option-progress"
                            style="width:${percentage}%"
                        ></div>

                    </div>


                    <div class="option-percent">

                        ${percentage}%

                    </div>

                </button>

            `;

        }
    );


    pollContainer.innerHTML = `

        <div class="poll-card">

            <div class="poll-status">

                <span class="live-dot"></span>

                LIVE POLL

            </div>


            <h1 class="poll-question">

                ${escapeHTML(
                    poll.question
                )}

            </h1>


            <p class="poll-description">

                ${voted
                    ? "You have already voted on this poll."
                    : "Choose one option to cast your vote."
                }

            </p>


            <div class="poll-options">

                ${optionsHTML}

            </div>


            <div class="poll-total">

                <strong>
                    ${totalVotes}
                </strong>

                total votes

            </div>

        </div>

    `;


    const optionButtons =
        pollContainer.querySelectorAll(
            ".poll-option"
        );


    optionButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.optionIndex
                        );


                    vote(
                        poll,
                        index
                    );

                }
            );

        }
    );

}


/* =====================================================
   VOTE
===================================================== */

async function vote(
    poll,
    optionIndex
) {

    if (hasVoted(poll.id)) {

        showMessage(
            "You have already voted on this poll."
        );

        return;

    }


    if (
        !poll.options ||
        !poll.options[optionIndex]
    ) {

        return;

    }


    try {

        showMessage(
            "Submitting your vote..."
        );


        const pollRef =
            doc(
                db,
                "polls",
                poll.id
            );


        await runTransaction(
            db,
            async (transaction) => {

                const pollSnapshot =
                    await transaction.get(
                        pollRef
                    );


                if (!pollSnapshot.exists()) {

                    throw new Error(
                        "Poll no longer exists."
                    );

                }


                const currentPoll =
                    pollSnapshot.data();


                if (
                    currentPoll.active !== true
                ) {

                    throw new Error(
                        "This poll is closed."
                    );

                }


                const updatedOptions =
                    currentPoll.options.map(
                        (option, index) => {

                            if (
                                index ===
                                optionIndex
                            ) {

                                return {

                                    ...option,

                                    votes:
                                        Number(
                                            option.votes ||
                                            0
                                        ) + 1

                                };

                            }


                            return option;

                        }
                    );


                transaction.update(
                    pollRef,
                    {
                        options:
                            updatedOptions
                    }
                );

            }
        );


        markVoted(
            poll.id
        );


        showMessage(
            "Vote submitted successfully!"
        );


    } catch (error) {

        console.error(error);


        showMessage(
            error.message ||
            "Unable to submit vote."
        );

    }

}


/* =====================================================
   VOTE STORAGE
===================================================== */

function getVoteKey(
    pollId
) {

    return (
        "skylark_poll_voted_" +
        pollId
    );

}


function hasVoted(
    pollId
) {

    return (
        localStorage.getItem(
            getVoteKey(
                pollId
            )
        ) === "true"
    );

}


function markVoted(
    pollId
) {

    localStorage.setItem(
        getVoteKey(
            pollId
        ),
        "true"
    );

}


/* =====================================================
   NO ACTIVE POLL
===================================================== */

function showNoPoll() {

    if (!pollContainer) {
        return;
    }


    pollContainer.innerHTML = `

        <div class="empty-poll">

            <div class="empty-icon">
                🗳️
            </div>


            <h2>
                No Active Poll
            </h2>


            <p>
                There is currently no active Skylark poll.
                Check back later!
            </p>

        </div>

    `;


    if (totalVotesElement) {

        totalVotesElement.textContent =
            "0";

    }

}


/* =====================================================
   ERROR
===================================================== */

function showError() {

    if (!pollContainer) {
        return;
    }


    pollContainer.innerHTML = `

        <div class="empty-poll">

            <div class="empty-icon">
                ⚠️
            </div>


            <h2>
                Unable to Load Poll
            </h2>


            <p>
                Please refresh the page and try again.
            </p>

        </div>

    `;

}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    message
) {

    if (!pollMessage) {
        return;
    }


    pollMessage.textContent =
        message;


    clearTimeout(
        showMessage.timeout
    );


    showMessage.timeout =
        setTimeout(
            () => {

                pollMessage.textContent =
                    "";

            },
            4000
        );

}


/* =====================================================
   HTML ESCAPE
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