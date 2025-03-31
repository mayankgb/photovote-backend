import path from "path"
import fs from "fs"
import { PrismaClient } from "@prisma/client"
import dotenv from "dotenv"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

dotenv.config()

const prisma = new PrismaClient()

const s3 = new S3Client({
    credentials: {
        accessKeyId: "AKIAQ3EGT6CUTMT25HPC",
        secretAccessKey:"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"
    },
    region: "us-east-1"
  });


async function uploadfile(filepath: string) {

    const fullPath = path.join(__dirname, "../ietrates")

    const newPath = path.join(fullPath, filepath)

    const fileContent = fs.readFileSync(newPath)
    const [name , age , branch] = filepath.split(", ")

    // console.log(newPath)
    // console.log(name)

    // const uploadParams = {
    //     Bucket: "photorate",
    //     Key: `path/${name}`,
    //     Body: fileContent,
    //     ContentType: "image/jpeg", // Adjust based on the file type
    //   };

    //   await s3.send(new PutObjectCommand(uploadParams))
      const fileurl = `https://d12hk4zd0jmtng.cloudfront.net/path/${name}`

      const branchId = await prisma.branch.findFirst({
        where: {
            name: branch.split(".")[0]
        },
        select: {
            id: true
        }
      })
      if (!branchId) {
        console.log(branch)
        console.log("branch is not present")
        return
      }

      const addUser = await prisma.user.create({
        data :{
            name: name,
            branchId: branchId.id,
            instituteId: "85f73ebb-4939-4fda-86e4-50a6fd7a2295",
            image: fileurl,
            role: "USER",
            age: parseInt(age)
        }
      })

      console.log(addUser.id)
}

async function uploadToS3() {
    const pathname = path.join(__dirname, "../ietrates")
    const files = fs.readdirSync(pathname)

    for (const file of files) {
        // uploadfile(file)
        const a = path.join(pathname, file)
        // console.log(a)
        uploadfile(file)
    }
}

uploadToS3()

// async function uploadfilee() {
//     const branch: Map<string, string> = new Map()
//     const file = path.join(__dirname, "../ietrates")
//     const names = fs.readdirSync(file)
//     for(const name of names) {
//         const newName = name.split(", ")[2].split(".")
//         // console.log(newName)
//         if (branch.has(newName[0])) {
//             console.log("break")
//             continue
//         }
//         branch.set(newName[0], "mayank")
//         console.log(newName)
//         console.log(branch)
        
//         const newBranch = await prisma.branch.create({
//             data: {
//                 name: newName[0],
//                 instiuteId: "85f73ebb-4939-4fda-86e4-50a6fd7a2295"
//             }
//         })

//         console.log(newBranch.id)
//     }
//     // console.log(names)

// }

// uploadfilee()