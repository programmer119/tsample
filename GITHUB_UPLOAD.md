# GitHub 업로드

이 폴더 안의 파일과 폴더 전체를 GitHub 저장소 루트에 업로드합니다.
저장소 첫 화면에서 다음 항목이 바로 보여야 합니다.

- Dockerfile
- .dockerignore
- pdf_renderer/
- frontend/
- apps_script/

Cloud Run의 Cloud Build 설정에서는 저장소 루트(`/`)의 `Dockerfile`을 사용합니다.
