import { CustomWebsocket, Participant } from "./types/types"

type participantId = string
type voterId = string


export class Contest {
    id: string
    contestName: string
    participant: Participant[]
    votedPerson: Map<voterId, participantId>
    userWs: Map<string, CustomWebsocket>
    adminId: string
    endContest: (contestId: string , instituteId: string) => {message: string, status: number}
    instituteId: string

    constructor(id: string, contestName: string,institueId: string, removeContest: (contestId: string, instituteId: string) => {message: string, status: number}, adminId: string)  {
        this.id = id
        this.contestName = contestName
        this.participant = []
        this.votedPerson = new Map()
        this.userWs = new Map()
        this.endContest = removeContest
        this.adminId = adminId
        this.instituteId = institueId
    }

    addUser(participant: Participant) {

        this.participant.push(participant)

    }

    addVoter(voterid: string, participantId: string) {
        if (this.votedPerson.has(voterid)) {
            return {
                message: "you already voted",
                status: 400
            }
        }
        this.votedPerson.set(voterid, participantId)
        return {
            message: "successfully voted",
            status: 200
        }
    }

    upvote(voterId: string, participantId: string) {
        if (this.votedPerson.has(voterId)) {
            return {
                message: "you already voted",
                status: 400
            }
        }

        const participantIndex = this.participant.findIndex((a) => a.id === participantId)

        if (participantIndex === -1) {
            return {
                message: "participant does not exists",
                status: 400
            }
        }

        this.participant[participantIndex].upvote += 1
        this.votedPerson.set(voterId, participantId)
        this.participant.sort((a, b) => b.upvote - a.upvote)

        this.userWs.forEach((ws) => {
            ws.send(JSON.stringify({
                data: this.participant.slice(0,10),
                status: 200,
                type: "data"
            }))
        })

        return {
            message: "successfully voted",
            data: this.participant,
            status: 200
        }

    }

    firstOnline(ws: CustomWebsocket) {

        this.userWs.set(ws.userId, ws)

        const leaderBoard = this.participant.slice(0,10)

        ws.send(JSON.stringify({
            status: 200,
            data: leaderBoard,
            type: "data"
        }))

        return
    }

    getAllParticipant(userId: string) {

        const isVoted = this.votedPerson.get(userId) ? true : false;

        return {
            participant: this.participant,
            isVoted: isVoted
        }
    }


    disconnect(userId: string) {
        this.userWs.delete(userId)
    }

    initDbLeaderBoard() {
        if (this.participant.length > 0) {
            this.participant.sort((a ,b) => b.upvote - a.upvote)
        }
    }


}