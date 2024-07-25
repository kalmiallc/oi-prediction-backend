# Verifier docker image build and push to Docker Hub

Build image:
```
docker build -t itkalmia/oi-match-attestation-server:latest .
```

Docker login:
```
docker login registry-1.docker.io -u itkalmia
```

Push image to Docker Hub:
```
docker push itkalmia/oi-match-attestation-server:latest
```
