[33mcommit 2ec2bce7892fc4168281bfb3d80d13d8c3d3a6ec[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m, [m[1;31morigin/main[m[33m)[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Mon Nov 2 21:47:02 2026 +0530

    Debug login issue

[33mcommit fe93125c09d97516bd2480b61236089e3380d9d5[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Mon Nov 2 20:11:06 2026 +0530

    Fix the logout localhost request link problem

[33mcommit 36a5bb15f399b01ca37559612f053ac90e84d5ba[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Sun Nov 1 21:04:16 2026 +0530

    Added SMS notification system
    
    SMS notification system was added without configuring the API key or Sender ID. Used FitSMS API request example for the process.

[33mcommit 97c18ef68eb255664efbd7dbcfebe7a714b12d1b[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Sun Nov 1 20:50:48 2026 +0530

    Added a email sending and fix the client side link issue

[33mcommit 8a07ab5650cdcb3ddff70c1af34ac6ce88fcbe64[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Sat Oct 31 15:50:53 2026 +0530

    Add a Client add form.

[33mcommit 7eee485eacab451decba6c6559d965403506a61b[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Fri Oct 30 20:32:15 2026 +0530

    Added a priority change request server side actions
    
    Customer care desk can request a priority change for a ticket. This action stays seperatly from the original ticket, only if the admin approve the request the original ticket priority changes.

[33mcommit 8ec68e01ffc607ca6293d1b6ebd52bbe973fbf43[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Fri Oct 30 20:04:07 2026 +0530

    Add customer care notes sever actions

[33mcommit b083ccd809a088fd9ef95268e316cdd0324e2ca9[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Thu Oct 29 23:59:26 2026 +0530

    Adding a neon S3 storage to upload files

[33mcommit 437d6007816ba1c04418123f17ac3120de91f26f[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Thu Oct 29 12:09:16 2026 +0530

    Add a search bar

[33mcommit b313a0f36ff8674131c9bc7b943297c034cccd1a[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Tue Oct 27 00:49:48 2026 +0530

    Fix the Admin Ticket workspace
    
    Admin ticket workspace backend function were added previously. All the functions related to a ticket were added to the ticket workspace. Removed some unusable parts from the UI and added new function like delete ticket, hold ticket, Assign new employees and etc. For the moment everything related to ticket workspace is finished.

[33mcommit e903d5d09c84db6b8e47742806a7c2d0fe03d7cf[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Sun Oct 25 14:49:10 2026 +0530

    Admin overview data fetching fix

[33mcommit 472009f8ea11d5098f9953ca79fcd9b06484f0c8[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Sun Oct 25 14:05:09 2026 +0530

    Finishing up the employee pannel with fixing the unnessery db queries and latency.

[33mcommit 03fcd139696ce6562ecc65da0f51f0a6529528b1[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Tue Oct 20 19:55:33 2026 +0530

    Updating the ticket workspace
    
    Ticket workspace did not had a back end. Added the API called, backend functions, and other nesseary funtionalityes. Changed the UI, added new handover note box. Took the log to the right hand side.

[33mcommit 1be142e42a496109db839bd44d55aa40f8868f1f[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Tue Oct 20 16:00:09 2026 +0530

    Change the attachment adding to a optional feature

[33mcommit 434c042fed614907f62768c729bafc7571dd42f4[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Sun Oct 18 23:29:17 2026 +0530

    Fix the issue with ticket submitting
    
    The tickets updating was taking too much time due to unnessary db queries and validation. Fixed it with fixing the saveemplyeeticket function and by adding a seperate table to keep track of ticket ID and job Number

[33mcommit d258878444f1c864e4097d50252b852a5ed5c2ee[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Fri Oct 16 14:31:57 2026 +0530

    Fix the database slow query issue
    
    Fix the issue which takes too long to load a page caused by unnessary db queries and duplicate queries. Use prisma's relation laod strategy : join to get a db level lateral join of the tables and fetch the data with fewwer queries and also added server side cache using usntable_cache

[33mcommit 42818a90a198b1191da28e1dc76cfa3944a3b4c1[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Wed Oct 7 23:12:25 2026 +0530

    Authentication
    
    Eventhough the database was connected, authentication and autherization was not properly working. Tha first step was to connect the database to authentication and write auth.ts. Then added seed to db

[33mcommit 2180c9569031686382e7a2090378197d460bcd6a[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Wed Oct 7 22:33:36 2026 +0530

    Add database
    
    Remove the current UI mock data and intergrate the database to the system and use that data as UI components

[33mcommit da224fd0ef038692a0d999ad01064ebed13b4b07[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Wed Oct 7 16:46:05 2026 +0530

    Create login and UI fixes

[33mcommit 4cdf208e92a69f8a683ce7ab46c9c032a110d08c[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Tue Oct 6 11:39:53 2026 +0530

    Updates on the UI
    
    Finalize the design the user interface according to the user roles

[33mcommit 075ef6ee5193d93c7db19cfb72124c8ac2f6eced[m
Author: Jithma Meegasdeniya <meegasdeniyarandil@gmail.com>
Date:   Sun Oct 4 17:49:16 2026 +0530

    Initial commit from Create Next App
