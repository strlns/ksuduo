// @vitest-environment jsdom
import {useState} from 'react';
import {act, cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {MessageQueue} from '../src/components/Message/MessageQueue';
import type {GameMessage} from '../src/components/Message/GameMessageBox';
afterEach(()=>{cleanup();vi.useRealTimers();});
function Harness() {
 const [messages,setMessages]=useState<GameMessage[]>(()=>['First','Second'].map(text=>({text,duration:1000,dismissable:true,dismiss:()=>setMessages(prev=>prev.filter(m=>m.text!==text))})));
 return <MessageQueue messages={messages}/>;
}
it('shows one notification at a time and gives each its full visible duration',()=>{
 vi.useFakeTimers();render(<Harness/>);
 expect(screen.getByText('First')).toBeTruthy();expect(screen.queryByText('Second')).toBeNull();
 act(()=>vi.advanceTimersByTime(1000));
 expect(screen.getByText('Second')).toBeTruthy();
 act(()=>vi.advanceTimersByTime(999));expect(screen.getByText('Second')).toBeTruthy();
 act(()=>vi.advanceTimersByTime(1));expect(screen.queryByRole('status')).toBeNull();
});
it('dismiss advances immediately and cancels the previous timer',()=>{
 vi.useFakeTimers();render(<Harness/>);act(()=>vi.advanceTimersByTime(900));
 fireEvent.click(screen.getByRole('button',{name:'Dismiss notification'}));
 act(()=>vi.advanceTimersByTime(100));expect(screen.getByText('Second')).toBeTruthy();
 cleanup();expect(vi.getTimerCount()).toBe(0);
});
