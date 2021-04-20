.PHONY: build-Notif19 build-RuntimeDependenciesLayer

build-RuntimeDependenciesLayer:
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	cp package.json yarn.lock "$(ARTIFACTS_DIR)/nodejs/"
	yarn install --cwd "$(ARTIFACTS_DIR)/nodejs/" --prod

build-Notif19:
	yarn install
	yarn compile
	cp -r dist "$(ARTIFACTS_DIR)/"