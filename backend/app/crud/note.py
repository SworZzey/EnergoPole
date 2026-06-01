from beanie import PydanticObjectId
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate
from datetime import datetime

async def create_note(note_data: NoteCreate, user_id: str) -> Note:
    note = Note(
        **note_data.model_dump(),
        created_by=PydanticObjectId(user_id)
    )
    await note.insert()
    return note

async def get_notes(project_id: str | None = None, skip: int = 0, limit: int = 100) -> list[Note]:
    query = {}
    if project_id:
        query["project_id"] = PydanticObjectId(project_id)
    return await Note.find(query).skip(skip).limit(limit).to_list()

async def get_note(note_id: str) -> Note | None:
    return await Note.get(note_id)

async def update_note(note_id: str, note_data: NoteUpdate) -> Note | None:
    note = await Note.get(note_id)
    if not note:
        return None
        
    update_data = note_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(note, key, value)
        
    note.updated_at = datetime.now()
    note.sync_version += 1
    await note.save()
    return note

async def delete_note(note_id: str) -> bool:
    note = await Note.get(note_id)
    if not note:
        return False
    await note.delete()
    return True
