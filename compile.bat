@echo off
(for /f "delims=" %%a in ('dir /b /a-d Acid\*.js') do (
	echo(
	echo(/*######### %%a #########*/
	echo(
	type Acid\"%%~a"
	echo(
))>Acid.js