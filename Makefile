.PHONY: build-RuntimeDependenciesLayer
.PHONY: build-Notif19

build-RuntimeDependenciesLayer:
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	cp package.json yarn.lock "$(ARTIFACTS_DIR)/nodejs/"
	yarn install --production --prefix "$(ARTIFACTS_DIR)/nodejs/"

build-Notif19:
	yarn install
	yarn compile
	cp -r dist "$(ARTIFACTS_DIR)/"