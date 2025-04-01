import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

async function createContest() {
    const newContest = await prisma.contest.create({
        data: {
            name: "Hottest Girl",
            adminId: "ccae5681-1ce7-4bbf-a4d3-cd2084a5d8c2",
            category: "FEMALE",
            instituteId: "85f73ebb-4939-4fda-86e4-50a6fd7a2295",
            endDate: new Date("2025-04-10T00:00:00Z"),
        },
        select: {
            id: true
        }
    })

    // const allUser = await prisma.user.findMany({
    //     where: {
    //         id: { not: "2f4528be-731e-4fc1-ad25-dbe69775a5af" }
    //     },
    //     select: {
    //         id: true
    //     }
    // })

    // if (allUser) {
    //     allUser.map(async (user) => {
    //         await prisma.participant.create({
    //             data: {
    //                 contestId: newContest.id,
    //                 userId: user.id,
    //                 status: "APPROVE"
    //             }
    //         })
    //     })
    // }

}

createContest()