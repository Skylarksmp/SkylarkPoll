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
    getDoc,
    getDocs,
    query,
    where,
    runTransaction,
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
   PLAYER ID
===================================================== */

function getPlayerId() {

    let id =
        localStorage.getItem(
            "skylark_player_id"
        );

    if (!id) {

        id =
            crypto.randomUUID();

        localStorage.setItem(
            "skylark_player_id",
            id
        );
    }

    return id;
}

const playerId = getPlayerId();


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
            "Firestore poll error:",
            error
        );

        showError(
            error.message
        );

    }
);


/* =====================================================
   RENDER POLL
===================================================== */

async function renderPoll(poll) {

    if (!pollContainer) {
        return;
    }


    const voted =
        await checkIfVoted(
            poll.id
        );


    const counts =
        await getVoteCounts(
            poll.id,
            poll.options.length
        );


    const total =
        counts.reduce(
            (a, b) => a + b,
            0
        );


    if (totalVotesElement) {

        totalVotesElement.textContent =
            total;

    }


    let optionsHTML = "";


    poll.options.forEach(
        (option, index) => {

            const votes =
                counts[index] || 0;


            const percent =
                total === 0
                    ? 0
                    : Math.round(
                        votes / total * 100
                    );


            optionsHTML += `

                <button
                    class="poll-option"
                    data-index="${index}"
                    ${voted ? "disabled" : ""}
                >

                    <div class="option-top">

                        <span class="option-name">
                            ${escapeHTML(option.text)}
                        </span>

                        <span class="option-votes">
                            ${votes} votes
                        </span>

                    </div>


                    <div class="option-bar">

                        <div
                            class="option-progress"
                            style="width:${percent}%"
                        ></div>

                    </div>


                    <div class="option-percent">
                        ${percent}%
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
                ${escapeHTML(poll.question)}
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
                    ${total}
                </strong>

                total votes

            </div>

        </div>

    `;


    const buttons =
        pollContainer.querySelectorAll(
            ".poll-option"
        );


    buttons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const index =
                        Number(
                            button.dataset.index
                        );

                    await submitVote(
                        poll,
                        index
                    );

                }
            );

        }
    );

}


/* =====================================================
   CHECK IF PLAYER VOTED
===================================================== */

async function checkIfVoted(pollId) {

    const localKey =
        "skylark_voted_" +
        pollId;

    if (
        localStorage.getItem(
            localKey
        ) === "true"
    ) {

        return true;

    }


    const voteId =
        pollId +
        "_" +
        playerId;


    try {

        const voteRef =
            doc(
                db,
                "votes",
                voteId
            );


        const voteSnapshot =
            await getDoc(
                voteRef
            );


        if (
            voteSnapshot.exists()
        ) {

            localStorage.setItem(
                localKey,
                "true"
            );

            return true;

        }


    } catch (error) {

        console.error(
            "Vote check error:",
            error
        );

    }


    return false;
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
   SUBMIT VOTE
===================================================== */

async function submitVote(
    poll,
    optionIndex
) {

    if (
        !poll.options ||
        !poll.options[optionIndex]
    ) {

        return;

    }


    const alreadyVoted =
        await checkIfVoted(
            poll.id
        );


    if (alreadyVoted) {

        showMessage(
            "You already voted on this poll."
        );

        return;

    }


    showMessage(
        "Submitting vote..."
    );


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


    try {

        await runTransaction(
            db,
            async (transaction) => {

                const existing =
                    await transaction.get(
                        voteRef
                    );


                if (
                    existing.exists()
                ) {

                    throw new Error(
                        "You already voted on this poll."
                    );

                }


                transaction.set(
                    voteRef,
                    {

                        pollId:
                            poll.id,

                        optionIndex:
                            optionIndex,

                        playerId:
                            playerId,

                        createdAt:
                            serverTimestamp()

                    }
                );

            }
        );


        localStorage.setItem(
            "skylark_voted_" +
            poll.id,
            "true"
        );


        showMessage(
            "Vote submitted successfully!"
        );


        await renderPoll(
            poll
        );


    } catch (error) {

        console.error(
            "Vote submission error:",
            error
        );


        showMessage(
            error.message ||
            "Vote failed."
        );

    }

}


/* =====================================================
   NO POLL
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
                There is currently no active
                Skylark poll.
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

function showError(message) {

    if (!pollContainer) {
        return;
    }


    console.error(
        "Skylark Poll:",
        message
    );


    pollContainer.innerHTML = `

        <div class="empty-poll">

            <div class="empty-icon">
                ⚠️
            </div>

            <h2>
                Unable to Load Poll
            </h2>

            <p>
                ${escapeHTML(
                    message ||
                    "Please refresh the page."
                )}
            </p>

        </div>

    `;

}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(message) {

    if (!pollMessage) {
        return;
    }


    pollMessage.textContent =
        message;


    clearTimeout(
        showMessage.timer
    );


    showMessage.timer =
        setTimeout(
            () => {

                pollMessage.textContent =
                    "";

            },
            4000
        );

}


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
