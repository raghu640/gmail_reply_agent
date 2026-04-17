I want to build an email reply agent for gmail then gmail api to fetch everythong from primary inbox the agent should craft the reply using openai or gemini api then there should be a supabase database where the knowledge is stored basically we have courses or programs regarding which we will receive emails so when the reply is crafted it should refer to the docuemtn mentioning the program info 

I need the ability to modify the email drafted by ai before sending if required
In the supabase the original email drafted by ai  and the one i sent should be stored the content should be deployed in vercel if backend functions are needed you can use railway

I also 
You should never send email automaically
The user should approve with one button click
Implement authentication so that only yhe owner of the email has the access 
the login can be via google login
For every email replied there should be a star rating and textual feedback option that is stored on supabase
The existing knowledge base in the existing directory should be converted to a vector database and stored in supabase 
You will have to perform rag to fetch the rerelvant info from the vector database
The implementation should happen in phases .So you should plan first ask my preferences and then execute in phases