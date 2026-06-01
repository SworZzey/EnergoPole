from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from app.crud.note import (
    create_note, get_notes, get_note, update_note, delete_note
)
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/notes", tags=["Замечания"])

@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note_route(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user)
):
    note = await create_note(note_data, user_id=str(current_user.id))
    return note

@router.get("/", response_model=List[NoteResponse])
async def list_notes_route(
    project_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    notes = await get_notes(project_id=project_id, skip=skip, limit=limit)
    return notes

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note_route(
    note_id: str,
    current_user: User = Depends(get_current_user)
):
    note = await get_note(note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Замечание с ID {note_id} не найдено"
        )
    return note

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note_route(
    note_id: str,
    note_data: NoteUpdate,
    current_user: User = Depends(get_current_user)
):
    note = await update_note(note_id, note_data)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Замечание с ID {note_id} не найдено"
        )
    return note

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note_route(
    note_id: str,
    current_user: User = Depends(get_current_user)
):
    deleted = await delete_note(note_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Замечание с ID {note_id} не найдено"
        )
