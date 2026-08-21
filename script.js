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
    getDocs,
    query,
    where,
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

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


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
   VOTE ID
===================================================== */

function getPlayerId() {

    let playerId =
        localStorage.getItem(
            "skylark_player_id"
        );

    if (!playerId) {

        playerId =
            crypto.randomUUID();

        localStorage.setItem(
            "skylark_player_id",
            playerId
        );

    }

    return playerId;
}


const playerId = getPlayerId();


/* =====================================================
   LOAD POLLS
===================================================== */

const pollsRef =
    collection(
        db,
        "polls"
    );


onSnapshot(
    pollsRef,

    async (snapshot) => {

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


        await renderPoll(
            activePoll
        );

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
   RENDER POLL
===================================================== */

async function renderPoll(
    poll
) {

    if (!pollContainer) {
        return;
    }


    const voted =
        await hasVoted(
            poll.id
        );


    const voteCounts =
        await getVoteCounts(
            poll.id,
            poll.options.length
        );


    const totalVotes =
        voteCounts.reduce(
            (total, count) =>
                total + count,
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
                voteCounts[index] || 0;


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
                            ${votes} votes
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

                ${
                    voted
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
   GET VOTE COUNTS
===================================================== */

async function getVoteCounts(
    pollId,
    optionCount
) {

    const counts =
        new Array(
            optionCount
        ).fill(0);


    try {

        const votesRef =
            collection(
                db,
                "votes"
            );


        const votesQuery =
            query(
                votesRef,
                where(
                    "pollId",
                    "==",
                    pollId
                )
            );


        const snapshot =
            await getDocs(
                votesQuery
            );


        snapshot.forEach(
            (voteDoc) => {

                const data =
                    voteDoc.data();


                const index =
                    Number(
                        data.optionIndex
                    );


                if (
                    index >= 0 &&
                    index < optionCount
                ) {

                    counts[index]++;

                }

            }
        );


    } catch (error) {

        console.error(
            "Vote count error:",
            error
        );

    }


    return counts;

}


/* =====================================================
   VOTE
===================================================== */

async function vote(
    poll,
    optionIndex
) {

    if (
        !poll ||
        !poll.options ||
        !poll.options[optionIndex]
    ) {

        return;

    }


    if (
        await hasVoted(
            poll.id
        )
    ) {

        showMessage(
            "You have already voted on this poll."
        );

        return;

    }


    try {

        showMessage(
            "Submitting your vote..."
        );


        /*
         * Each player gets one vote document
         * per poll.
         */

        const voteId =
            poll.id +
            "_" +
            playerId;


        const voteRef =
            doc(
                db,
                "votes",
                voteId
            );


        await runTransaction(
            db,
            async (transaction) => {

                const existingVote =
                    await transaction.get(
                        voteRef
                    );


                if (
                    existingVote.exists()
                ) {

                    throw new Error(
                        "You have already voted on this poll."
                    );

                }


                transaction.set(
                    voteRef,
                    {

                        pollId:
                            poll.id,

                        optionIndex:
                            optionIndex,

                        createdAt:
                            new Date()

                    }
                );

            }
        );


        localStorage.setItem(
            getVoteKey(
                poll.id
            ),
            "true"
        );


        showMessage(
            "Vote submitted successfully!"
        );


        /*
         * Refresh the poll immediately
         * so the player sees the result.
         */

        await renderPoll(
            poll
        );


    } catch (error) {

        console.error(
            "Vote error:",
            error
        );


        if (
            error.message.includes(
                "already voted"
            )
        ) {

            localStorage.setItem(
                getVoteKey(
                    poll.id
                ),
                "true"
            );

        }


        showMessage(
            error.message ||
            "Unable to submit vote."
        );

    }

}


/* =====================================================
   LOCAL VOTE STORAGE
===================================================== */

function getVoteKey(
    pollId
) {

    return (
        "skylark_poll_voted_" +
        pollId
    );

}


function hasLocalVoted(
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


/* =====================================================
   CHECK FIRESTORE VOTE
===================================================== */

async function hasVoted(
    pollId
) {

    if (
        hasLocalVoted(
            pollId
        )
    ) {

        return true;

    }


    try {

        const voteId =
            pollId +
            "_" +
            playerId;


        const voteRef =
            doc(
                db,
                "votes",
                voteId
            );


        /*
         * We don't need another request here.
         * The local ID protects the normal user flow.
         */

        return false;

    } catch {

        return false;

    }

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
