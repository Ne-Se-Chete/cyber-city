# Docker descriptor for online_bank
# License - http://www.eclipse.org/legal/epl-v20.html

FROM dirigiblelabs/dirigible:latest

COPY ez-go target/dirigible/repository/root/registry/public/ez-go
COPY frontend/graph-visualizer target/dirigible/repository/root/registry/public/graph-visualizer

ENV DIRIGIBLE_HOME_URL=/services/web/graph-visualizer/index.html

ENV DIRIGIBLE_MULTY_TENANT_MODE=false
ENV DIRIGIBLE_TRIAL_ENABLED=false

EXPOSE 8080
