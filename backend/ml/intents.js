// Training data for VoteBot's intent classifier.
// Each intent has: a `tag` (the label the model learns to predict) and `patterns`
// (example phrasings a user might type). More/varied patterns = better classification.
// Add more patterns here any time you want to improve accuracy for a given intent —
// then just restart the server; the classifier retrains automatically on boot.

module.exports = [
  {
    tag: 'greeting',
    patterns: [
      'hi', 'hello', 'hey', 'good morning', 'good evening', 'hey there',
      'is anyone there', 'hello bot', 'hi votebot', 'greetings'
    ]
  },
  {
    tag: 'thanks',
    patterns: [
      'thank you', 'thanks', 'thanks a lot', 'appreciate it', 'that helped, thanks',
      'ok thank you', 'great thanks', 'thanks for the help'
    ]
  },
  {
    tag: 'how_to_signup',
    patterns: [
      'how do I sign up', 'how to create an account', 'how do I make an account',
      'how to register an account', 'sign up process', 'how can I join this platform',
      'steps to create account', 'I want to sign up', 'how do I get started here',
      'account creation steps'
    ]
  },
  {
    tag: 'how_to_register_voter',
    patterns: [
      'how do I register to vote', 'how to submit voter registration',
      'voter registration process', 'how do I become an approved voter',
      'what documents do I need to register', 'how to apply to vote',
      'steps for voter registration', 'how do I submit my application',
      'what is needed for registration', 'how does the registration form work'
    ]
  },
  {
    tag: 'registration_status',
    patterns: [
      'what is my registration status', 'has my application been approved',
      'is my registration approved', 'check my application status',
      'am I approved to vote', 'did the admin approve me',
      'status of my voter application', 'is my registration pending',
      'why is my application still pending', 'was my registration rejected'
    ]
  },
  {
    tag: 'how_to_vote',
    patterns: [
      'how do I cast my vote', 'how to vote on this platform', 'steps to vote',
      'how does voting work here', 'what do I need to vote',
      'how do I use my unique code to vote', 'process of casting a vote',
      'how does face verification work when voting', 'what happens when I vote',
      'can you explain the voting steps'
    ]
  },
  {
    tag: 'unique_code_info',
    patterns: [
      'what is my unique code', 'where do I find my voting code',
      'I lost my unique code', 'what is the 6 digit code for',
      'why do I need a code to vote', 'unique code not working',
      'when do I get my voting code', 'is the unique code the same as OTP'
    ]
  },
  {
    tag: 'face_verification_help',
    patterns: [
      'how does face verification work', 'why do I need to scan my face',
      'face recognition is not working', 'camera is not detecting my face',
      'why is my face capture failing', 'is my face data safe',
      'how is my face data stored', 'face scan for voting'
    ]
  },
  {
    tag: 'voting_phase_info',
    patterns: [
      'is voting open right now', 'when does voting start', 'when does voting end',
      'what are the voting hours', 'is the voting phase active',
      'can I vote today', 'what time can I vote', 'is voting closed'
    ]
  },
  {
    tag: 'candidates_info',
    patterns: [
      'who are the candidates', 'list of candidates', 'which parties are contesting',
      'tell me about the candidates', 'who is running in this election',
      'what parties can I vote for', 'show me the candidate list',
      'who am I voting for'
    ]
  },
  {
    tag: 'manifesto_query',
    patterns: [
      'what is the manifesto of BJP', 'what does INC promise', 'AAP manifesto',
      'what are the party promises', 'tell me about party manifestos',
      'what is this party focusing on', 'what policies does this party support',
      'compare party manifestos', 'what are the key promises of each party'
    ]
  },
  {
    tag: 'election_history',
    patterns: [
      'what were the past election results', 'previous election vote share',
      'how did BJP perform in past elections', 'past election data',
      'historical election results', 'who won the last election',
      'election results by year', 'show me past vote counts'
    ]
  },
  {
    tag: 'growth_analysis_info',
    patterns: [
      'how has the economy grown', 'tell me about GDP growth',
      'how has health improved over the years', 'education growth data',
      'sector wise development', 'how is the country developing',
      'growth in employment', 'infrastructure development data',
      'show me growth insights'
    ]
  },
  {
    tag: 'results_info',
    patterns: [
      'what are the election results', 'who won the election', 'final results',
      'have results been published', 'show me the winner',
      'vote count results', 'when will results be published'
    ]
  },
  {
    tag: 'blockchain_info',
    patterns: [
      'what is the blockchain used for', 'how are votes secured',
      'is my vote tamper proof', 'how does the blockchain work here',
      'explain the blockchain feature', 'is voting data secure',
      'can votes be changed after casting'
    ]
  },
  {
    tag: 'password_help',
    patterns: [
      'I forgot my password', 'how do I reset my password',
      'can\'t log in', 'password reset process', 'change my password'
    ]
  }
];
