.PHONY: build-Notif19 build-RuntimeDependenciesLayer

build-RuntimeDependenciesLayer:
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	cp package.json "$(ARTIFACTS_DIR)/nodejs/"
	npm install --production --prefix "$(ARTIFACTS_DIR)/nodejs/"

build-Notif19:
	npm install
	npm run compile
	cp -r dist "$(ARTIFACTS_DIR)/"