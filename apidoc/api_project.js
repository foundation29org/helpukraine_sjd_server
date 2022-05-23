define({
  "name": "Health29",
  "version": "1.0.0",
  "description": "API docs",
  "apidoc": "0.3.0",
  "header": {
    "title": "Introduction",
    "content": "<h1>Introduction</h1>\n<blockquote>\n<p><a href=\"https://virtualhubukraine.azurewebsites.net/\" target=\"_blank\">Health29</a> provides a Web API for accessing data. Anyone can develop an application to access and modify a Health29 user's data. <a href=\"https://oauth.net/2/\" target=\"_blank\">OAuth 2.0</a> (Implicit Grant) is used as an authorization protocol to give an API client limited access to user data.</p>\n</blockquote>\n<h3>Quick Start</h3>\n<ul>\n<li>Most requests to the API require an access token as authentication.\nFor this, go to  <a href=\"#api-Access_token-signIn\">Get access_token</a></li>\n<li>Once we have the access token, we can make the calls to the api, passing the access token in the header.</li>\n</ul>\n<h3>Notes</h3>\n<p>All Methods APIs that have the authorization field in the header use Bearer authentication to restrict access to protected resources, , and always be sent next to a token. The bearer token is a cryptic string, generated by the server in response to a <a href=\"#api-Access_token-signIn\">login request</a>.\nExample of the header: <code>Authorization: Bearer &lt;token&gt;</code></p>\n<p>These requests can return some errors, such as the token is invalid, or has expired:\n<code>{ status: 401, message: &quot;Token expired&quot;}</code> or <code>{ status: 401, message: &quot;Invalid Token&quot;}</code></p>\n"
  },
  "footer": {
    "title": "About Health29",
    "content": "<h1>About Health29</h1>\n<blockquote>\n<p>Health29 is an online platform created by the Fundación 29 de Febrero (&quot;Foundation 29&quot;), in order to facilitate research and help with the treatment of the disease. To do this, a database of patients will be created, being intrinsic to the use of the platform the treatment of personal health data. In case you do not give your express consent through the marking of the corresponding box at the time of registration, you can not become a user of the platform.</p>\n</blockquote>\n<h3>What is Foundation29?</h3>\n<blockquote>\n<p>Foundation 29 is a non-profit patient organization focused on building expert systems that capture data in a transparent and automatic way, allowing citizens to return control of their data in order to support biomedical research.</p>\n</blockquote>\n<blockquote>\n<p>We lead a transformation that puts people in the center and empowers them, turning them into active decision makers, owners of their own information and their own health</p>\n</blockquote>\n<h3>Privacy guarantees</h3>\n<blockquote>\n<p>All information related to the platform is strictly confidential and its management must comply with the provisions of Law 15/1999, of December 13, on the Protection of Personal Data (&quot;LOPD&quot;).</p>\n</blockquote>\n<blockquote>\n<p>The data will be maintained in a computerized registry protected by high-level security measures, as stipulated in the law, with Foundation 29 being responsible for safeguarding the data.</p>\n</blockquote>\n<blockquote>\n<p>The data will be treated confidentially, in accordance with the provisions of the LOPD and Royal Decree 1720/2007 of December 21, which approves the Development Regulations of the LOPD (&quot;RLOPD&quot;). The data will be incorporated into the databases of Foundation 29, in order to facilitate research, the development of new drugs or help with the treatment of the disease.</p>\n</blockquote>\n<blockquote>\n<p>The use of the information will be confidential. Therefore, the patient's identity will always be protected. Likewise, the data can only be made public in reports, scientific meetings, medical conferences or publications. The data will be reported as anonymous and aggregated, that is, as percentages or numerical data without the possibility of identifying participants without their consent. The data will not be provided to any other type of entity without the patient's permission.</p>\n</blockquote>\n<blockquote>\n<p>Being part of the Health29 platform implies the possibility of gathering information for research. In this regard, you consent to the collection and processing of the information for the aforementioned purpose.</p>\n</blockquote>\n<blockquote>\n<p>Foundation 29, as responsible for data processing, will take the necessary measures to guarantee the security of the personal data provided, avoiding any alteration, loss or unauthorized access.</p>\n</blockquote>\n<p>Copyright  ©  2018 <a href=\"http://www.foundation29.org\" target=\"_blank\">Foundation29</a>, All rights reserved.</p>\n"
  },
  "sampleUrl": false,
  "defaultVersion": "0.0.0",
  "generator": {
    "name": "apidoc",
    "time": "2022-05-23T11:30:47.802Z",
    "url": "https://apidocjs.com",
    "version": "0.28.1"
  }
});
