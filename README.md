# No-Context Mashina Twitter Bot


## Step 0 - prerequisites

* A Twitter account, with developer account enabled
* Setup an app and generate CLIENT_ID & CLIENT_SECRET
* Generate SECRET_KEY, SECRET_IV & ENCRYPTION_METHOD to be used in crypto.createCipheriv()

## Step 1 - configuration
create a `.env` file
```properties
REDIRECT_URL=http://localhost:23001/redirect
CLIENT_ID=
CLIENT_SECRET=

SECRET_KEY=
SECRET_IV=
ENCRYPTION_METHOD=
```

## Step 2 - Generate refresh token

You need to run (one time) an authorization flow via browser

1. Start the server for the redirect flow
```shell
npm run auth
```
2. Go to:
```
http://localhost:23001/auth
```

3. Authorize app 

Refresh token will be saved (encrypted) to a local store


## Step 3 - Build docker image

```shell
npm run build:image
```


## Step 4 - Start docker

(replace XXX with real values)

```shell
docker run -d -e CLIENT_ID=XXX -e CLIENT_SECRET=XXX -e SECRET_KEY=XXX -e SECRET_IV=XXX -e ENCRYPTION_METHOD=XXX -v no-context-mashina:/usr/app/ext --name no-context-mashina --restart unless-stopped no-context-mashina
```

## Step 5 - (one-time) Copy refresh-token store to container 

```shell
npm run copy-tokens-to-container
```

