# No-Context Mashina Twitter Bot


### Compile

```shell
npm run tsc
```

### Build image

```shell
npm run build:image
```

### Start docker

```shell
docker run -d -e CLIENT_ID=XXX -e CLIENT_SECRET=XXX -e SECRET_KEY=XXX -e SECRET_IV=XXX -e ENCRYPTION_METHOD=XXX -v no-context-mashina:/usr/app/resources/cache --name no-context-mashina --restart unless-stopped no-context-mashina
```