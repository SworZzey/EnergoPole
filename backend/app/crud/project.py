from beanie import PydanticObjectId
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from datetime import datetime

async def create_project(project_data: ProjectCreate, user_id: str) -> Project:
    project = Project(
        **project_data.model_dump(),
        created_by=PydanticObjectId(user_id)
    )
    await project.insert()
    return project

async def get_projects(skip: int = 0, limit: int = 100) -> list[Project]:
    return await Project.find().skip(skip).limit(limit).to_list()

async def get_project(project_id: str) -> Project | None:
    return await Project.get(project_id)

async def update_project(project_id: str, project_data: ProjectUpdate) -> Project | None:
    project = await Project.get(project_id)
    if not project:
        return None
        
    update_data = project_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
        
    project.updated_at = datetime.now()
    project.sync_version += 1
    await project.save()
    return project

async def delete_project(project_id: str) -> bool:
    project = await Project.get(project_id)
    if not project:
        return False
    await project.delete()
    return True
