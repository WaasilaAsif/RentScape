## Log Summary

| Number | Name | Focus | Requires an action by other members (Read the next section if yes) | What I did |
|---|---|---|---|---|
| 1 | Aman |Database| | Set up the supabase and made all the tables |
| 2 | Waasila | Database Connetion | yes | I worked on configuring the prisma for setting up the db and to have a smooth experience but was met with an issue |
|2.1| Waasila | Database Connection | yes | Eduroam was the culprit|
|2.2| Waasila | Database Connection | yes | Finally connected to the databse and got the thing to work. 3 hours !!!!!|
| 3 | Waasila | Database connection | optional | Wrote the lib.ts file |
|3.1| Waasila | Backend | optional | Created some connecting docs |
|3.2| Waasila | Backend | no | Run npm install for this |

## Tell about your problem or in general what you did

### Log 2
---
OK so I spent 3 hours trying ot configure prisma but discovered that it wont be able to eb acessed because of eduroam blocking outbound connections we will have to use vpn to connect to our db
Will add the details here soon
#### log 2.2 
Ok so  VPN does not work wiht vpn so we had to use mobile data I almost gave up
But you can get the vpm to eun using 
``` name
proton.com
```
Other than that after setting up the commands ran to set up 
(I will add details if you guys need to add as well)
```shell
npx prisma db pull
npx prisma generate
npm install pg
```
### Log 3 

Ok so I just added a few things in lib.ts
What it does?
>Basially it uses the same connetion to supabase on multiple attempts based on the time limit
>> For example instead of establishing a new connection each time and crashiing the server it uses and reuses the connection eensuring efficiency

Ok so reated the get session and get user a few stuff left will do tomorrw
And after all the integrations I will merge with main as well



