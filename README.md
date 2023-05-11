## Issuer Portal

### [**Figma Link**](https://www.figma.com/file/EZWR86B1mR2oGExHe9Jib5/Issuer-Portal)

#### Dashboard
- Capital breakdown
  - Outstanding shares
    - Unrestricted shares
      - Num in street name / Cede
      - Num in DRS (all following are DRS)
    - Treasury shares
    - Restricted shares
      - Employee plan shares reserved
      - Restricted plan shares granted
  - Authorized Shares
  - Full report of shares
- Top 20 DRS holders
- Market data about stock
- SEC filings

#### Reports
- Capital breakdown (assuming some kind of query + PDF output in real time)
- Insider trading reports
- Geographic investor trends
  - Pie chart US holders vs. Canada vs. International
- Share capital breakdown
  - Offerings?

#### Activity
- Shares to/from brokers vs. DRS
- (For us) Actual DRS activity
  - Direct transfers
  - Private sales (all report I guess)
  - Claimed restricted/vested stock?

#### Holders
- Search all / full list
  - Sounds like what we have rn at issuersbeta.blocktransfer.io
- Future potential: analytics
  - Someone sell your stock and buy co. in same industry 
  - Trends? 

#### Voting
- Meeting Management
  - Show / set:
    - meeting date
    - meeting time
    - meeting physical location
    - (optional) meeting virtual location
    - custom text for message box in email template
    - record date
    - mail date (see appendix)
    - digital N&A card preview (deprecated example below)
    - plain-English company name
- (For us) Live proxy results

#### Tools
- File sharing
- Messaging
- Issue shares
  - For us: (all this assuming they log in with a hardware wallet)
    - transfer request for issuer account to send shares to destination
      - build txn where BT_ISSUER sends shares to destination
      - set memo (required) with constraint limit checking for byte size
      - sign transaction locally with issuer treasury account
        - CSV uploads for bulk payroll ops
      - blockchain details thereunder:
        - issuer treasury account is part of omnibus muxed BT_ISSUER signer
        - muxed account has weight below min_thresh and can combine with server key to effect issue
        - server looks up specific treasury account signer referenced from mux
        - gets the company treasury address and resolves the stock they represent
        - for new issues: send out new issue based on memo formatted as [amountUnrestrictedMainStock]|federationAddr
          - this works since restricted employee grants come from the plan holdings or direct treasury
      - send to server which validates signature
      - if valid, server signs and issues
        - safe b/c only works if hardware signs
- Deposit/withdraw from broker (for us: perhaps redundant and ignore given auto DWAC via SEP6/FIRE server)
- Import list of brokerage investors to add to DRS dataset for analytics (future feature?)

#### Help
- FAQs
- Guides
- Support communication

#### Governance
- Generate insider trading report
- Board communications
  - Upload annual report
  - Upload proxy statement
  - New special meeting
- Global entity share management (Board spread across var. firms)

#### Settings
- Manage company information
- §270.17a-7 transactions (from Treasury)
- Manage affiliates
- Access users
  - Should be able to search through their shareholders to add someone as an access user (tbd, hardware auth here vs app access)
  - e.g. they could get a popup on their phone app, and review/sign everything with their local key
  - circle around on this once Vikas plays around more with hardware auth

#### Future Desired Things
- Stock options
- Vesting data
- Investors to have accounts they can log in on an app to see share balances / vesting schedule & history
- Easy TA support so that the investors don't call the company

**Misc Proxy Notes**
Broker search
- T-64  Request text for message box in email template
- T-60  Record date
- T-59  Share record-date list
- T-59  request combined digital annual report and 10K/digital proxy statement and card
- T-55  Upload docs and establish proper web addresses incl. federation
- T-54  Submit postgrid campaign (5-10 biz days for delivery, including 2-day processing)
- T-47  Send emails
- T-46  Submit new postgrid campaign for undeliverable emails
- T-43  Send signed affidavit of notice
- T-15  Send preliminary vote results
- T-1   Send day-prior vote results
- T     Send final vote results

#### automated form 8949 info
- https://medium.com/@zwinny/filling-pdf-forms-in-python-the-right-way-eb9592e03dba
- https://www.blog.pythonlibrary.org/2018/05/22/filling-pdf-forms-with-python/
- https://akdux.com/python/2020/10/31/python-fill-pdf-files/
- https://pypdf2.readthedocs.io/en/latest/user/forms.html#filling-out-forms
- https://pypi.org/project/fillpdf/
- https://www.securexfilings.com/wp-content/uploads/2013/04/sched13d.pdf

### Affiliate Voting - see custody notes
- implement the transfer server and credentials updates via lambda calls with the actual pii easily dispersed in dynamo
- For counting affiliate votes, we can also do indefinite returnable CBs from AFF*affiliate.holdings to AFFs (which net to zero in affiliate.holdings), and the issuer could easily manage changes on that side themselves (to/from brokers with auto-rep letters) for Rule 144/Section 10 reporting on their side themselves (prevents us from needing their CCC)
- (parallel to scanning for standard avaliable to claim restricted stock which is legally granted and votable) (edited) 
- (but still have automatic purchase statement/notifications for insider buys)
- (where you have firm affiliations internal as a secondary dynamo index for balance check sweeps and pings at time of purchase or transfer gift per rolling week to check for misses into AFF CBs)
