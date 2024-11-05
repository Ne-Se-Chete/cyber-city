# Docker descriptor for online_bank
# License - http://www.eclipse.org/legal/epl-v20.html

FROM dirigiblelabs/dirigible:latest

COPY ez-go target/dirigible/repository/root/registry/public/ez-go
COPY frontend/graph-visualizer target/dirigible/repository/root/registry/public/graph-visualizer

ENV DIRIGIBLE_HOME_URL=/services/web/graph-visualizer/index.html

ENV DIRIGIBLE_SINGLE_TENANT_MODE_ENABLED=true

EXPOSE 8080
