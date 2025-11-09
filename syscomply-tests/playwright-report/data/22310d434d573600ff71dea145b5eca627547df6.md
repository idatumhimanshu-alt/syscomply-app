# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications Alt+T"
  - generic [ref=e10]:
    - heading "Sign in" [level=4] [ref=e12]
    - form [ref=e14]:
      - generic [ref=e16]:
        - generic [ref=e17]: Email
        - generic [ref=e18]:
          - textbox "Email" [ref=e19]: admin@idatum.com
          - group:
            - generic: Email
      - generic [ref=e21]:
        - generic [ref=e22]: Password
        - generic [ref=e23]:
          - textbox "Password" [ref=e24]: Admin@123
          - group:
            - generic: Password
      - paragraph [ref=e26] [cursor=pointer]: Forgot Password?
      - button "Login" [ref=e28] [cursor=pointer]: Login
```